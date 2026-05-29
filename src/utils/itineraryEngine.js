import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateBudgetItinerary(city, totalBudget, totalDays, preferences) {
  try {
    const activitiesRef = collection(db, 'Destinations_Activities');
    
    // Fetch all records to filter safely on the client side
    const querySnapshot = await getDocs(activitiesRef);
    let availableActivities = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Case-insensitive, clean matching for flexible searches
      if (data.city && data.city.toLowerCase() === city.toLowerCase()) {
        availableActivities.push({ id: doc.id, ...data });
      }
    });

    if (availableActivities.length === 0) {
      return { error: `No activities found in our database for "${city}" yet.` };
    }

    // Prioritize by user vibe preferences
    let prioritizedActivities = availableActivities.sort((a, b) => {
      const aMatch = preferences.includes(a.category) ? 1 : 0;
      const bMatch = preferences.includes(b.category) ? 1 : 0;
      return bMatch - aMatch; 
    });

    const dailyBudgetCap = totalBudget / totalDays;
    let dynamicTimeline = [];
    let allocatedCost = 0;

    const timeSlots = ["Morning", "Afternoon", "Evening", "Night"];
    let activityPointer = 0;

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      let dailyCostAccumulator = 0;

      for (const slot of timeSlots) {
        if (activityPointer >= prioritizedActivities.length) {
          activityPointer = 0; 
        }

        const candidate = prioritizedActivities[activityPointer];
        const costPerPerson = candidate.estimatedCostPerPerson || 0;

        if (dailyCostAccumulator + costPerPerson <= dailyBudgetCap) {
          dynamicTimeline.push({
            day: `Day ${dayNum}`,
            time: slot === 'Morning' ? '09:00 AM' : slot === 'Afternoon' ? '01:00 PM' : slot === 'Evening' ? '05:30 PM' : '08:30 PM',
            type: candidate.category.toUpperCase(),
            cost: costPerPerson === 0 ? 'Free Entry' : `$${costPerPerson}`,
            title: candidate.activityName,
            desc: candidate.description,
            tags: [candidate.costCategory, candidate.category],
            image: candidate.category === 'Nature' 
              ? 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60'
              : 'https://images.unsplash.com/photo-1542296332-2e4473fac563?w=500&auto=format&fit=crop&q=60'
          });

          dailyCostAccumulator += costPerPerson;
          allocatedCost += costPerPerson;
          activityPointer++;
        } else {
          activityPointer++;
        }
      }
      if (dayNum >= totalDays) break; 
    }

    return {
      title: `The ${city} Personalized Journey`,
      dates: `Optimized Plan for ${totalDays} Days`,
      travelers: `Custom Group Package`,
      days: Array.from({ length: totalDays }, (_, i) => `Day ${i + 1}`),
      timeline: dynamicTimeline,
      calculatedTotalExpense: allocatedCost
    };

  } catch (error) {
    console.error("Error running generation algorithm:", error);
    throw error;
  }
}