import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateBudgetItinerary(city, totalBudget, totalDays, preferences, totalTravelers = 1) {
  try {
    const groupSize = Number(totalTravelers) || 1;

    // 1. FETCH LOCAL LIVING BASES (HOTEL & FOOD COSTS) FOR THE TARGET CITY
    const costRef = collection(db, 'Local_Costs');
    const costQuery = query(costRef, where('city', '==', city));
    const costSnapshot = await getDocs(costQuery);
    
    let cityBaselines = {
      hotelCostPerNight: 40, 
      mealCostPerDay: 15,
      tier: 'Mid-Range'
    };

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
        error: `Your budget of $${totalBudget.toLocaleString()} is too tight for ${groupSize} travelers across a ${totalDays}-day stay in ${city}. Fixed group logistics (Hotel + Food) will cost roughly $${(totalGroupHotelCost + totalGroupMealCost).toLocaleString()}. Try scaling up budget parameters or dropping trip duration numbers.` 
      };
    }

    // 2. FETCH AND PRIORITIZE SIGHTSEEING ACTIONS
    const activitiesRef = collection(db, 'Destinations_Activities');
    const activityQuery = query(activitiesRef, where('city', '==', city));
    const querySnapshot = await getDocs(activityQuery);
    
    let availableActivities = [];
    querySnapshot.forEach((doc) => {
      availableActivities.push({ id: doc.id, ...doc.data() });
    });

    if (availableActivities.length === 0) {
      return { error: `No activity assets indexed inside our database for "${city}" yet.` };
    }

    let prioritizedActivities = availableActivities.sort((a, b) => {
      const aMatch = preferences.includes(a.category) ? 1 : 0;
      const bMatch = preferences.includes(b.category) ? 1 : 0;
      return bMatch - aMatch; 
    });

    const dailyActivityCap = remainingActivityBudget / totalDays;
    let dynamicTimeline = [];
    let groupActivitySpendingTotal = 0;

    const slots = ["Morning", "Afternoon", "Evening", "Night"];
    let pointer = 0;
    let fallbackCounter = 0; // Prevent infinite loops if data pool is completely exhausted

    for (let d = 1; d <= totalDays; d++) {
      let dailyGroupAccumulator = 0;
      let usedActivityIdsThisDay = new Set(); // FIXED TRACKER: Tracks items utilized *only* on the current day loop

      if (cityBaselines.hotelCostPerNight > 0) {
        dynamicTimeline.push({
          day: `Day ${d}`,
          time: "08:00 AM",
          type: "LOGISTICS",
          cost: d === totalDays ? "Check-out" : `$${(cityBaselines.hotelCostPerNight * totalRoomsNeeded).toLocaleString()}`,
          title: `${cityBaselines.tier} Lodging (${totalRoomsNeeded} Room${totalRoomsNeeded > 1 ? 's' : ''})`,
          description: `Group accommodations baseline set for ${groupSize} travelers.`,
          tags: ["Hotel", `Room Qty: ${totalRoomsNeeded}`],
          latitude: availableActivities[0]?.latitude || null,
          longitude: availableActivities[0]?.longitude || null,
          image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=60"
        });
      }

      for (const slot of slots) {
        fallbackCounter = 0;
        let candidateFound = false;

        while (fallbackCounter < prioritizedActivities.length) {
          if (pointer >= prioritizedActivities.length) pointer = 0;

          const candidate = prioritizedActivities[pointer];
          const uniqueId = candidate.activityId || candidate.id;

          // DUP CHECK LOGIC: Only proceed if this specific activity hasn't been scheduled today
          if (!usedActivityIdsThisDay.has(uniqueId)) {
            const perPersonCost = Number(candidate.estimatedCostPerPerson) || 0;
            const totalGroupActivityCost = perPersonCost * groupSize;

            if (dailyGroupAccumulator + totalGroupActivityCost <= dailyActivityCap) {
              dynamicTimeline.push({
                day: `Day ${d}`,
                time: slot === 'Morning' ? '10:00 AM' : slot === 'Afternoon' ? '02:00 PM' : slot === 'Evening' ? '06:00 PM' : '09:00 PM',
                type: candidate.category ? candidate.category.toUpperCase() : "SIGHTSEEING",
                cost: totalGroupActivityCost === 0 ? 'Free Entry' : `$${totalGroupActivityCost.toLocaleString()} (Group)`,
                title: candidate.activityName,
                description: candidate.description || "No custom description summary details logged inside CSV assets.", // Unified variable name mapping
                perPersonCost: perPersonCost,
                tags: [candidate.costCategory || "Standard", candidate.category || "General"],
                latitude: Number(candidate.latitude) || null,
                longitude: Number(candidate.longitude) || null,
                image: "https://images.unsplash.com/photo-1542296332-2e4473fac563?w=500&auto=format&fit=crop&q=60"
              });

              dailyGroupAccumulator += totalGroupActivityCost;
              groupActivitySpendingTotal += totalGroupActivityCost;
              usedActivityIdsThisDay.add(uniqueId);
              candidateFound = true;
              pointer++;
              break; // Break the while look, move onto next time slot smoothly
            }
          }
          pointer++;
          fallbackCounter++;
        }

        // If data pool completely runs out of un-used entries, map a clean structural evening transit block
        if (!candidateFound && slot === "Night") {
          dynamicTimeline.push({
            day: `Day ${d}`,
            time: "09:00 PM",
            type: "LEISURE",
            cost: "Free",
            title: "Open Evening Exploration",
            description: "Relax at your hotel, explore local neighborhood markets, or enjoy dinner at leisure.",
            tags: ["Flexible", "Rest"],
            latitude: null,
            longitude: null,
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60"
          });
        }
      }

      if (cityBaselines.mealCostPerDay > 0) {
        dynamicTimeline.push({
          day: `Day ${d}`,
          time: "07:30 PM",
          type: "DINING",
          cost: `$${(cityBaselines.mealCostPerDay * groupSize).toLocaleString()}`,
          title: `Food & Dining for ${groupSize} People`,
          description: `Allocated group meal buffer budget based on ${cityBaselines.tier.toLowerCase()}-tier local rates.`,
          tags: ["Food", `Qty: ${groupSize}`],
          latitude: null,
          longitude: null,
          image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60"
        });
      }
    }

    return {
      title: `The ${city} Balanced Escape`,
      dates: `Optimized Group Configuration Plan`,
      travelers: `${groupSize} Travelers (${cityBaselines.tier} Profile)`,
      days: Array.from({ length: totalDays }, (_, i) => `Day ${i + 1}`),
      timeline: dynamicTimeline,
      calculatedTotalExpense: totalGroupHotelCost + totalGroupMealCost + groupActivitySpendingTotal
    };

  } catch (error) {
    console.error("Group Calculation loop crashed:", error);
    throw error;
  }
}