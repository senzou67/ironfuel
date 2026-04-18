const NutritionService = {
    // Mifflin-St Jeor formula (most accurate for most people)
    calculateBMR(profile) {
        const { sex, weight, height, age } = profile;
        if (sex === 'male') {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    },

    activityMultipliers: {
        sedentary: 1.2,     // Bureau, pas de sport
        light: 1.375,       // 1-3x/semaine sport léger
        moderate: 1.55,     // 3-5x/semaine sport modéré
        active: 1.725,      // 6-7x/semaine sport intense
        very_active: 1.9    // 2x/jour ou travail physique + sport
    },

    calculateDailyNeeds(profile) {
        const bmr = this.calculateBMR(profile);
        const tdee = Math.round(bmr * (this.activityMultipliers[profile.activity] || 1.55));
        const goal = profile.goal || 'maintain';
        const weight = profile.weight || 70;
        const sex = profile.sex || 'male';

        let calories, protein, carbs, fat;

        if (goal === 'lose') {
            // Déficit proportionnel: 20% du TDEE (pas fixe -500)
            // Plus sûr et adapté aux petits gabarits
            const deficit = Math.round(tdee * 0.20);
            calories = Math.max(1200, tdee - deficit); // Jamais sous 1200 kcal
            // Perte: protéines hautes (2g/kg) pour préserver la masse musculaire
            protein = Math.round(weight * 2.0);
            // Fat minimum 0.8g/kg pour les hormones
            fat = Math.round(weight * 0.9);
            // Carbs = ce qui reste
            carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
            if (carbs < 50) carbs = 50; // Minimum carbs

        } else if (goal === 'gain') {
            // Surplus modéré: 10-15% du TDEE (clean bulk)
            const surplus = Math.round(tdee * 0.12);
            calories = tdee + surplus;
            // Prise: protéines à 1.8g/kg, plus de carbs pour l'énergie
            protein = Math.round(weight * 1.8);
            fat = Math.round(weight * 1.0);
            carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

        } else {
            // Maintien: TDEE tel quel
            calories = tdee;
            // Protéines à 1.6g/kg (recommandation ISSN pour sportifs)
            protein = Math.round(weight * 1.6);
            fat = Math.round(weight * 1.0);
            carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
        }

        // Fibre: 14g/1000 kcal (Institute of Medicine)
        const fiber = Math.round(calories * 14 / 1000);

        // Sécurité: recalculer les calories à partir des macros réels
        // Fibre comptée à 2 kcal/g (fermentation colique partielle).
        calories = Math.round(protein * 4 + carbs * 4 + fat * 9 + fiber * 2);

        return { calories, protein, carbs, fat, fiber, tdee, bmr: Math.round(bmr) };
    },

    calculateBMI(weight, heightCm) {
        const heightM = heightCm / 100;
        return Math.round((weight / (heightM * heightM)) * 10) / 10;
    },

    getBMICategory(bmi) {
        if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'var(--protein-color)' };
        if (bmi < 25) return { label: 'Poids normal', color: 'var(--success)' };
        if (bmi < 30) return { label: 'Surpoids', color: 'var(--carbs-color)' };
        return { label: 'Obésité', color: 'var(--danger)' };
    }
};
