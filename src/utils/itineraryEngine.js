import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function parseDurationToHours(durationStr) {
  if (!durationStr) return 2.0; 
  const num = parseFloat(durationStr);
  return isNaN(num) ? 2.0 : num;
}

function formatClockTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMinute = m < 10 ? `0${m}` : m;
  return `${displayHour}:${displayMinute} ${ampm}`;
}

function isSeasonMatching(travelDateStr, bestMonthsStr) {
  if (!bestMonthsStr || bestMonthsStr.toLowerCase() === 'year-round' || bestMonthsStr.toLowerCase() === 'all') {
    return true;
  }
  try {
    const travelDate = new Date(travelDateStr);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const travelMonth = monthNames[travelDate.getMonth()];

    if (bestMonthsStr.includes('-')) {
      const [startMonth, endMonth] = bestMonthsStr.split('-').map(m => m.trim());
      const startIndex = monthNames.indexOf(startMonth);
      const endIndex = monthNames.indexOf(endMonth);
      const currentIndex = monthNames.indexOf(travelMonth);

      if (startIndex <= endIndex) {
        return currentIndex >= startIndex && currentIndex <= endIndex;
      } else {
        return currentIndex >= startIndex || currentIndex <= endIndex;
      }
    }
    return bestMonthsStr.toLowerCase().includes(travelMonth.toLowerCase());
  } catch (e) {
    return true; 
  }
}

export async function generateBudgetItinerary(city, totalBudget, totalDays, preferences, totalTravelers = 1, startDateStr = "") {
  try {
    const groupSize = Number(totalTravelers) || 1;

    // 1. FETCH LIVING BASES (HOTEL & FOOD)
    const costRef = collection(db, 'Local_Costs');
    const costQuery = query(costRef, where('city', '==', city));
    const costSnapshot = await getDocs(costQuery);
    
    let cityBaselines = { hotelCostPerNight: 40, mealCostPerDay: 15, tier: 'Mid-Range' };

    if (!costSnapshot.empty) {
      const costData = costSnapshot.docs[0].data();
      const individualSpendingPerDay = (totalBudget / groupSize) / totalDays;

      if (totalBudget <= (30 * groupSize) && totalDays === 1) {
        cityBaselines.hotelCostPerNight = 0;
        cityBaselines.mealCostPerDay = 0;
        cityBaselines.tier = 'Micro-Budget';
      } else if (individualSpendingPerDay < 60) {
        cityBaselines.hotelCostPerNight = Number(costData.hotelBudgetPerNight) || 15;
        cityBaselines.mealCostPerDay = Number(costData.avgMealCostBudget) || 8;
        cityBaselines.tier = 'Budget';
      } else if (individualSpendingPerDay >= 60 && individualSpendingPerDay < 200) {
        cityBaselines.hotelCostPerNight = Number(costData.hotelMidRangePerNight) || 45;
        cityBaselines.mealCostPerDay = Number(costData.avgMealCostMidRange) || 20;
        cityBaselines.tier = 'Mid-Range';
      } else {
        cityBaselines.hotelCostPerNight = Number(costData.hotelLuxuryPerNight) || 150;
        cityBaselines.mealCostPerDay = Number(costData.avgMealCostLuxury) || 50;
        cityBaselines.tier = 'Luxury';
      }
    }

    const totalRoomsNeeded = Math.ceil(groupSize / 2);
    const totalGroupHotelCost = cityBaselines.hotelCostPerNight * totalRoomsNeeded * (totalDays - 1);
    const totalGroupMealCost = cityBaselines.mealCostPerDay * groupSize * totalDays;
    const remainingActivityBudget = totalBudget - (totalGroupHotelCost + totalGroupMealCost);

    if (remainingActivityBudget < 0) {
      return { 
        error: `Your budget of $${totalBudget.toLocaleString()} is too tight. Logistics (Hotel + Food) will cost roughly $${(totalGroupHotelCost + totalGroupMealCost).toLocaleString()}.` 
      };
    }

    // 2. FETCH ACTIVITIES FROM FIRESTORE
    const activitiesRef = collection(db, 'Destinations_Activities');
    const activityQuery = query(activitiesRef, where('city', '==', city));
    const querySnapshot = await getDocs(activityQuery);
    
    let availableActivities = [];
    querySnapshot.forEach((doc) => {
      availableActivities.push({ id: doc.id, ...doc.data() });
    });

    if (availableActivities.length === 0) {
      return { error: `No activity data found for "${city}" yet.` };
    }

    if (startDateStr) {
      availableActivities = availableActivities.filter(act => 
        isSeasonMatching(startDateStr, act.bestMonthsToVisit)
      );
    }

    if (availableActivities.length === 0) {
      return { error: `We have activities for ${city}, but none are recommended during your selected travel month!` };
    }

    let prioritizedActivities = availableActivities.sort((a, b) => {
      const aMatch = preferences.includes(a.category) ? 1 : 0;
      const bMatch = preferences.includes(b.category) ? 1 : 0;
      return bMatch - aMatch; 
    });

    const dailyActivityCap = remainingActivityBudget / totalDays;
    let dynamicTimeline = [];
    let groupActivitySpendingTotal = 0;
    let pointer = 0;

    // 3. CONTINUOUS DAILY CLOCK ENGINE
    for (let d = 1; d <= totalDays; d++) {
      let dailyGroupAccumulator = 0;
      let usedActivityIdsThisDay = new Set();
      
      let currentClockTime = 9.0; 
      const clockEndLimit = 20.0; 

      // Morning Logistics Node
      if (cityBaselines.hotelCostPerNight > 0) {
        dynamicTimeline.push({
          day: `Day ${d}`,
          time: "08:30 AM",
          type: "LOGISTICS",
          cost: d === totalDays ? "Check-out" : `$${(cityBaselines.hotelCostPerNight * totalRoomsNeeded).toLocaleString()}`,
          title: `${cityBaselines.tier} Lodging (${totalRoomsNeeded} Rooms)`,
          description: `Group accommodations setup baseline.`,
          tags: ["Hotel"],
          latitude: availableActivities[0]?.latitude || null,
          longitude: availableActivities[0]?.longitude || null,
          image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=60"
        });
      }

      let fallbackLoopCounter = 0;

      while (currentClockTime < clockEndLimit && fallbackLoopCounter < prioritizedActivities.length * 2) {
        if (pointer >= prioritizedActivities.length) pointer = 0;

        const candidate = prioritizedActivities[pointer];
        const uniqueId = candidate.activityId || candidate.id;

        if (!usedActivityIdsThisDay.has(uniqueId)) {
          const perPersonCost = Number(candidate.estimatedCostPerPerson) || 0;
          const totalGroupActivityCost = perPersonCost * groupSize;
          const durationHours = parseDurationToHours(candidate.averageDuration);

          if ((dailyGroupAccumulator + totalGroupActivityCost <= dailyActivityCap) && (currentClockTime + durationHours <= clockEndLimit)) {
            
            // CRUCIAL BULLETPROOF IMAGE RESOLUTION
            // Checks if an image exists in Firestore; fallback layout if empty or null
            const hasCustomImage = candidate.image && typeof candidate.image === 'string' && candidate.image.trim() !== "";
            const finalImageSrc = hasCustomImage ? candidate.image.trim() : "https://images.unsplash.com/photo-1542296332-2e4473fac563?w=500&auto=format&fit=crop&q=60";

            dynamicTimeline.push({
              day: `Day ${d}`,
              time: formatClockTime(currentClockTime),
              type: (candidate.category || "Sightseeing").toUpperCase(),
              cost: totalGroupActivityCost === 0 ? 'Free Entry' : `$${totalGroupActivityCost.toLocaleString()}`,
              title: candidate.activityName,
              description: `${candidate.description || ''} (Duration: ${candidate.averageDuration || '2 hours'})`,
              tags: [candidate.costCategory || "Budget", `Duration: ${candidate.averageDuration || '2h'}`],
              latitude: Number(candidate.latitude) || null,
              longitude: Number(candidate.longitude) || null,
              image: finalImageSrc
            });

            dailyGroupAccumulator += totalGroupActivityCost;
            groupActivitySpendingTotal += totalGroupActivityCost;
            usedActivityIdsThisDay.add(uniqueId);
            
            currentClockTime += durationHours + 0.5; 
          }
        }
        pointer++;
        fallbackLoopCounter++;
      }

      if (currentClockTime < clockEndLimit) {
        const gapDuration = clockEndLimit - currentClockTime;
        dynamicTimeline.push({
          day: `Day ${d}`,
          time: formatClockTime(currentClockTime),
          type: "LEISURE & TRANSITION",
          cost: "Free",
          title: "Local Exploration & Relaxation",
          description: `Enjoy a free window of ${gapDuration} hours to explore nearby local markets, relax at a local cafe, or rest before dinner.`,
          tags: ["Flexible"],
          latitude: null,
          longitude: null,
          image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60"
        });
      }

      // Evening Dining Node
      if (cityBaselines.mealCostPerDay > 0) {
        dynamicTimeline.push({
          day: `Day ${d}`,
          time: "08:00 PM",
          type: "DINING",
          cost: `$${(cityBaselines.mealCostPerDay * groupSize).toLocaleString()}`,
          title: `Dinner Allocation`,
          description: `Daily dining allowances for ${groupSize} travelers.`,
          tags: ["Food"],
          latitude: null,
          longitude: null,
          image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60"
        });
      }
    }

    return {
      title: `The ${city} Seamless Journey`,
      dates: `Continuous Clock Optimized Plan`,
      travelers: `${groupSize} Travelers (${cityBaselines.tier})`,
      days: Array.from({ length: totalDays }, (_, i) => `Day ${i + 1}`),
      timeline: dynamicTimeline,
      calculatedTotalExpense: totalGroupHotelCost + totalGroupMealCost + groupActivitySpendingTotal
    };

  } catch (error) {
    console.error("Continuous engine calculation loop crashed:", error);
    throw error;
  }
}