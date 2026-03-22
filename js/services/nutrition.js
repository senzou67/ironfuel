const NutritionService = {
    // Mifflin-St Jeor formula
    calculateBMR(profile) {
        const { sex, weight, height, age } = profile;
        if (sex === 'male') {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    },

    activityMultipliers: {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    },

    goalAdjustments: {
        lose: -500,
        maintain: 0,
        gain: 300
    },

    calculateDailyNeeds(profile) {
        const bmr = this.calculateBMR(profile);
        const tdee = bmr * (this.activityMultipliers[profile.activity] || 1.55);
        const adjustment = this.goalAdjustments[profile.goal] || 0;
        const calories = Math.round(tdee + adjustment);

        // Standard macro split: 30% protein, 40% carbs, 30% fat
        const protein = Math.round((calories * 0.30) / 4);
        const carbs = Math.round((calories * 0.40) / 4);
        const fat = Math.round((calories * 0.30) / 9);
        // Fiber: 14g per 1000 kcal (Institute of Medicine recommendation)
        const fiber = Math.round(calories * 14 / 1000);

        return { calories, protein, carbs, fat, fiber };
    },

    calculateBMI(weight, heightCm) {
        const heightM = heightCm / 100;
        return Math.round((weight / (heightM * heightM)) * 10) / 10;
    },

    getBMICategory(bmi) {
        if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: '#2196F3' };
        if (bmi < 25) return { label: 'Poids normal', color: '#4CAF50' };
        if (bmi < 30) return { label: 'Surpoids', color: '#FF9800' };
        return { label: 'Obésité', color: '#f44336' };
    }
};
