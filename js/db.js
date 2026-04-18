const FoodDB = {
    categories: [
        { id: 'fruits', name: 'Fruits', icon: '🍎' },
        { id: 'legumes', name: 'Légumes', icon: '🥬' },
        { id: 'viandes', name: 'Viandes', icon: '🥩' },
        { id: 'poissons', name: 'Poissons', icon: '🐟' },
        { id: 'laitiers', name: 'Produits laitiers', icon: '🧀' },
        { id: 'feculents', name: 'Féculents', icon: '🍚' },
        { id: 'legumineuses', name: 'Légumineuses', icon: '🫘' },
        { id: 'noix', name: 'Noix & Graines', icon: '🥜' },
        { id: 'boissons', name: 'Boissons', icon: '🥤' },
        { id: 'matieres_grasses', name: 'Matières grasses', icon: '🫒' },
        { id: 'snacks', name: 'Snacks', icon: '🍪' },
        { id: 'plats', name: 'Plats préparés', icon: '🍽️' },
        { id: 'petit_dejeuner', name: 'Petit-déjeuner', icon: '🥐' },
        { id: 'sauces', name: 'Sauces & Condiments', icon: '🧂' },
        { id: 'charcuterie', name: 'Charcuterie', icon: '🥓' },
        { id: 'fromages', name: 'Fromages', icon: '🧀' },
        { id: 'desserts', name: 'Desserts', icon: '🍰' },
        { id: 'fast_food', name: 'Fast food', icon: '🍔' },
        { id: 'ethnique', name: 'Plats ethniques', icon: '🍜' },
        { id: 'vegetarien', name: 'Produits végétariens', icon: '🌱' },
        { id: 'cereales', name: 'Céréales & Grains', icon: '🌾' },
        { id: 'confiseries', name: 'Confiseries', icon: '🍬' }
    ],

    // Valeurs nutritionnelles pour 100g : [calories, protéines, glucides, lipides, fibres]
    foods: [
        // === FRUITS ===
        { id: 1, name: 'Pomme', cat: 'fruits', n: [52, 0.3, 13.8, 0.2, 2.4] },
        { id: 2, name: 'Banane', cat: 'fruits', n: [89, 1.1, 22.8, 0.3, 2.6] },
        { id: 3, name: 'Orange', cat: 'fruits', n: [47, 0.9, 11.8, 0.1, 2.4] },
        { id: 4, name: 'Fraise', cat: 'fruits', n: [32, 0.7, 7.7, 0.3, 2.0] },
        { id: 5, name: 'Raisin', cat: 'fruits', n: [69, 0.7, 18.1, 0.2, 0.9] },
        { id: 6, name: 'Poire', cat: 'fruits', n: [57, 0.4, 15.2, 0.1, 3.1] },
        { id: 7, name: 'Pêche', cat: 'fruits', n: [39, 0.9, 9.5, 0.3, 1.5] },
        { id: 8, name: 'Mangue', cat: 'fruits', n: [60, 0.8, 15.0, 0.4, 1.6] },
        { id: 9, name: 'Ananas', cat: 'fruits', n: [50, 0.5, 13.1, 0.1, 1.4] },
        { id: 10, name: 'Kiwi', cat: 'fruits', n: [61, 1.1, 14.7, 0.5, 3.0] },
        { id: 11, name: 'Cerise', cat: 'fruits', n: [63, 1.1, 16.0, 0.2, 2.1] },
        { id: 12, name: 'Abricot', cat: 'fruits', n: [48, 1.4, 11.1, 0.4, 2.0] },
        { id: 13, name: 'Melon', cat: 'fruits', n: [34, 0.8, 8.2, 0.2, 0.9] },
        { id: 14, name: 'Pastèque', cat: 'fruits', n: [30, 0.6, 7.6, 0.2, 0.4] },
        { id: 15, name: 'Myrtille', cat: 'fruits', n: [57, 0.7, 14.5, 0.3, 2.4] },
        { id: 16, name: 'Framboise', cat: 'fruits', n: [52, 1.2, 11.9, 0.7, 6.5] },
        { id: 17, name: 'Clémentine', cat: 'fruits', n: [47, 0.9, 12.0, 0.2, 1.7] },
        { id: 18, name: 'Prune', cat: 'fruits', n: [46, 0.7, 11.4, 0.3, 1.4] },
        { id: 19, name: 'Grenade', cat: 'fruits', n: [83, 1.7, 18.7, 1.2, 4.0] },
        { id: 20, name: 'Litchi', cat: 'fruits', n: [66, 0.8, 16.5, 0.4, 1.3] },
        { id: 21, name: 'Avocat', cat: 'fruits', n: [160, 2.0, 8.5, 14.7, 6.7] },
        { id: 22, name: 'Figue', cat: 'fruits', n: [74, 0.8, 19.2, 0.3, 2.9] },
        { id: 23, name: 'Pamplemousse', cat: 'fruits', n: [42, 0.8, 10.7, 0.1, 1.6] },
        { id: 24, name: 'Citron', cat: 'fruits', n: [29, 1.1, 9.3, 0.3, 2.8] },

        // === LÉGUMES ===
        { id: 30, name: 'Carotte', cat: 'legumes', n: [41, 0.9, 9.6, 0.2, 2.8] },
        { id: 31, name: 'Tomate', cat: 'legumes', n: [18, 0.9, 3.9, 0.2, 1.2] },
        { id: 32, name: 'Concombre', cat: 'legumes', n: [15, 0.7, 3.6, 0.1, 0.5] },
        { id: 33, name: 'Courgette', cat: 'legumes', n: [17, 1.2, 3.1, 0.3, 1.0] },
        { id: 34, name: 'Aubergine', cat: 'legumes', n: [25, 1.0, 5.9, 0.2, 3.0] },
        { id: 35, name: 'Poivron rouge', cat: 'legumes', n: [31, 1.0, 6.0, 0.3, 2.1] },
        { id: 36, name: 'Poivron vert', cat: 'legumes', n: [20, 0.9, 4.6, 0.2, 1.7] },
        { id: 37, name: 'Brocoli', cat: 'legumes', n: [34, 2.8, 6.6, 0.4, 2.6] },
        { id: 38, name: 'Chou-fleur', cat: 'legumes', n: [25, 1.9, 5.0, 0.3, 2.0] },
        { id: 39, name: 'Haricots verts', cat: 'legumes', n: [31, 1.8, 7.0, 0.1, 3.4] },
        { id: 40, name: 'Épinards', cat: 'legumes', n: [23, 2.9, 3.6, 0.4, 2.2] },
        { id: 41, name: 'Salade verte', cat: 'legumes', n: [15, 1.4, 2.9, 0.2, 1.3] },
        { id: 42, name: 'Champignon', cat: 'legumes', n: [22, 3.1, 3.3, 0.3, 1.0] },
        { id: 43, name: 'Oignon', cat: 'legumes', n: [40, 1.1, 9.3, 0.1, 1.7] },
        { id: 44, name: 'Ail', cat: 'legumes', n: [149, 6.4, 33.1, 0.5, 2.1] },
        { id: 45, name: 'Poireau', cat: 'legumes', n: [61, 1.5, 14.2, 0.3, 1.8] },
        { id: 46, name: 'Chou blanc', cat: 'legumes', n: [25, 1.3, 5.8, 0.1, 2.5] },
        { id: 47, name: 'Petits pois', cat: 'legumes', n: [81, 5.4, 14.5, 0.4, 5.1] },
        { id: 48, name: 'Maïs', cat: 'legumes', n: [86, 3.3, 19.0, 1.4, 2.7] },
        { id: 49, name: 'Radis', cat: 'legumes', n: [16, 0.7, 3.4, 0.1, 1.6] },
        { id: 50, name: 'Navet', cat: 'legumes', n: [28, 0.9, 6.4, 0.1, 1.8] },
        { id: 51, name: 'Betterave', cat: 'legumes', n: [43, 1.6, 9.6, 0.2, 2.8] },
        { id: 52, name: 'Artichaut', cat: 'legumes', n: [47, 3.3, 10.5, 0.2, 5.4] },
        { id: 53, name: 'Asperge', cat: 'legumes', n: [20, 2.2, 3.9, 0.1, 2.1] },
        { id: 54, name: 'Céleri', cat: 'legumes', n: [16, 0.7, 3.0, 0.2, 1.6] },
        { id: 55, name: 'Fenouil', cat: 'legumes', n: [31, 1.2, 7.3, 0.2, 3.1] },
        { id: 56, name: 'Endive', cat: 'legumes', n: [17, 1.3, 3.4, 0.1, 3.1] },

        // === VIANDES ===
        { id: 60, name: 'Poulet (blanc)', cat: 'viandes', n: [165, 31.0, 0, 3.6, 0] },
        { id: 61, name: 'Poulet (cuisse)', cat: 'viandes', n: [209, 26.0, 0, 10.9, 0] },
        { id: 62, name: 'Dinde (blanc)', cat: 'viandes', n: [135, 30.0, 0, 1.0, 0] },
        { id: 63, name: 'Bœuf (steak haché 5%)', cat: 'viandes', n: [137, 26.0, 0, 5.0, 0] },
        { id: 64, name: 'Bœuf (steak haché 15%)', cat: 'viandes', n: [218, 24.0, 0, 15.0, 0] },
        { id: 65, name: 'Bœuf (entrecôte)', cat: 'viandes', n: [271, 26.0, 0, 19.0, 0] },
        { id: 66, name: 'Bœuf (rumsteck)', cat: 'viandes', n: [150, 28.0, 0, 5.0, 0] },
        { id: 67, name: 'Porc (filet)', cat: 'viandes', n: [143, 26.0, 0, 3.5, 0] },
        { id: 68, name: 'Porc (côtelette)', cat: 'viandes', n: [231, 25.0, 0, 14.0, 0] },
        { id: 69, name: 'Agneau (gigot)', cat: 'viandes', n: [234, 25.0, 0, 14.0, 0] },
        { id: 70, name: 'Agneau (côtelette)', cat: 'viandes', n: [294, 22.0, 0, 22.0, 0] },
        { id: 71, name: 'Veau (escalope)', cat: 'viandes', n: [172, 31.0, 0, 5.0, 0] },
        { id: 72, name: 'Canard (magret)', cat: 'viandes', n: [337, 19.0, 0, 28.6, 0] },
        { id: 73, name: 'Lapin', cat: 'viandes', n: [136, 20.0, 0, 6.0, 0] },
        { id: 74, name: 'Jambon blanc', cat: 'viandes', n: [115, 21.0, 1.0, 3.0, 0] },
        { id: 75, name: 'Jambon cru', cat: 'viandes', n: [241, 28.0, 0.3, 14.0, 0] },
        { id: 76, name: 'Saucisson sec', cat: 'viandes', n: [452, 26.0, 2.0, 38.0, 0] },
        { id: 77, name: 'Merguez', cat: 'viandes', n: [280, 15.0, 2.0, 24.0, 0] },
        { id: 78, name: 'Saucisse de Strasbourg', cat: 'viandes', n: [280, 12.0, 2.0, 25.0, 0] },
        { id: 79, name: 'Lardons', cat: 'viandes', n: [280, 15.0, 0.5, 24.0, 0] },
        { id: 80, name: 'Bacon', cat: 'viandes', n: [300, 25.0, 1.0, 22.0, 0] },

        // === POISSONS ===
        { id: 90, name: 'Saumon', cat: 'poissons', n: [208, 20.0, 0, 13.0, 0] },
        { id: 91, name: 'Thon (frais)', cat: 'poissons', n: [144, 23.0, 0, 5.0, 0] },
        { id: 92, name: 'Thon (en conserve)', cat: 'poissons', n: [116, 26.0, 0, 1.0, 0] },
        { id: 93, name: 'Cabillaud', cat: 'poissons', n: [82, 18.0, 0, 0.7, 0] },
        { id: 94, name: 'Crevettes', cat: 'poissons', n: [99, 24.0, 0.2, 0.3, 0] },
        { id: 95, name: 'Moules', cat: 'poissons', n: [86, 12.0, 3.7, 2.2, 0] },
        { id: 96, name: 'Sardine', cat: 'poissons', n: [208, 25.0, 0, 11.5, 0] },
        { id: 97, name: 'Maquereau', cat: 'poissons', n: [205, 19.0, 0, 13.9, 0] },
        { id: 98, name: 'Truite', cat: 'poissons', n: [141, 20.0, 0, 6.6, 0] },
        { id: 99, name: 'Sole', cat: 'poissons', n: [86, 18.0, 0, 1.2, 0] },
        { id: 100, name: 'Bar (loup)', cat: 'poissons', n: [97, 18.0, 0, 2.0, 0] },
        { id: 101, name: 'Dorade', cat: 'poissons', n: [100, 20.0, 0, 2.5, 0] },
        { id: 102, name: 'Saumon fumé', cat: 'poissons', n: [117, 18.0, 0, 4.3, 0] },
        { id: 103, name: 'Surimi', cat: 'poissons', n: [95, 8.0, 12.0, 1.0, 0] },
        { id: 104, name: 'Calamars', cat: 'poissons', n: [92, 15.6, 3.1, 1.4, 0] },

        // === PRODUITS LAITIERS ===
        { id: 110, name: 'Lait entier', cat: 'laitiers', n: [61, 3.2, 4.8, 3.3, 0] },
        { id: 111, name: 'Lait demi-écrémé', cat: 'laitiers', n: [46, 3.2, 4.8, 1.6, 0] },
        { id: 112, name: 'Lait écrémé', cat: 'laitiers', n: [34, 3.4, 5.0, 0.1, 0] },
        { id: 113, name: 'Yaourt nature', cat: 'laitiers', n: [61, 3.5, 4.7, 3.3, 0] },
        { id: 114, name: 'Yaourt 0%', cat: 'laitiers', n: [43, 4.3, 6.3, 0.1, 0] },
        { id: 115, name: 'Fromage blanc 0%', cat: 'laitiers', n: [45, 7.0, 3.8, 0.1, 0] },
        { id: 116, name: 'Fromage blanc 3%', cat: 'laitiers', n: [58, 6.8, 3.8, 3.0, 0] },
        { id: 117, name: 'Emmental', cat: 'laitiers', n: [380, 27.0, 0.5, 29.7, 0] },
        { id: 118, name: 'Comté', cat: 'laitiers', n: [413, 27.0, 0.5, 34.0, 0] },
        { id: 119, name: 'Camembert', cat: 'laitiers', n: [299, 20.0, 0.5, 24.0, 0] },
        { id: 120, name: 'Chèvre (bûche)', cat: 'laitiers', n: [290, 21.0, 1.0, 22.0, 0] },
        { id: 121, name: 'Mozzarella', cat: 'laitiers', n: [280, 22.0, 2.2, 20.0, 0] },
        { id: 122, name: 'Parmesan', cat: 'laitiers', n: [431, 38.0, 4.1, 29.0, 0] },
        { id: 123, name: 'Roquefort', cat: 'laitiers', n: [369, 21.0, 2.0, 31.0, 0] },
        { id: 124, name: 'Brie', cat: 'laitiers', n: [334, 21.0, 0.5, 27.7, 0] },
        { id: 125, name: 'Crème fraîche 30%', cat: 'laitiers', n: [292, 2.4, 3.3, 30.0, 0] },
        { id: 126, name: 'Crème fraîche 15%', cat: 'laitiers', n: [160, 2.6, 3.8, 15.0, 0] },
        { id: 127, name: 'Beurre', cat: 'laitiers', n: [717, 0.9, 0.1, 81.0, 0] },
        { id: 128, name: 'Skyr', cat: 'laitiers', n: [63, 11.0, 4.0, 0.2, 0] },
        { id: 129, name: 'Cottage cheese', cat: 'laitiers', n: [98, 11.0, 3.4, 4.3, 0] },

        // === FÉCULENTS ===
        { id: 140, name: 'Riz blanc (cuit)', cat: 'feculents', n: [130, 2.7, 28.2, 0.3, 0.4] },
        { id: 141, name: 'Riz complet (cuit)', cat: 'feculents', n: [111, 2.6, 23.0, 0.9, 1.8] },
        { id: 142, name: 'Pâtes (cuites)', cat: 'feculents', n: [131, 5.0, 25.0, 1.1, 1.8] },
        { id: 143, name: 'Pâtes complètes (cuites)', cat: 'feculents', n: [124, 5.3, 23.0, 1.4, 3.2] },
        { id: 144, name: 'Pomme de terre', cat: 'feculents', n: [77, 2.0, 17.0, 0.1, 2.2] },
        { id: 145, name: 'Patate douce', cat: 'feculents', n: [86, 1.6, 20.1, 0.1, 3.0] },
        { id: 146, name: 'Pain blanc', cat: 'feculents', n: [265, 9.0, 49.0, 3.2, 2.7] },
        { id: 147, name: 'Pain complet', cat: 'feculents', n: [247, 13.0, 41.0, 3.4, 6.8] },
        { id: 148, name: 'Pain de mie', cat: 'feculents', n: [267, 8.0, 49.0, 4.0, 2.4] },
        { id: 149, name: 'Baguette', cat: 'feculents', n: [270, 9.5, 55.0, 1.2, 2.7] },
        { id: 150, name: 'Quinoa (cuit)', cat: 'feculents', n: [120, 4.4, 21.3, 1.9, 2.8] },
        { id: 151, name: 'Boulgour (cuit)', cat: 'feculents', n: [83, 3.1, 18.6, 0.2, 4.5] },
        { id: 152, name: 'Semoule (cuite)', cat: 'feculents', n: [112, 3.6, 23.0, 0.2, 1.4] },
        { id: 153, name: 'Couscous (cuit)', cat: 'feculents', n: [112, 3.8, 23.2, 0.2, 1.4] },
        { id: 154, name: 'Flocons d\'avoine', cat: 'feculents', n: [367, 14.0, 58.0, 7.0, 10.6] },
        { id: 155, name: 'Biscottes', cat: 'feculents', n: [407, 11.0, 75.0, 7.0, 3.5] },
        { id: 156, name: 'Tortilla (blé)', cat: 'feculents', n: [312, 8.0, 52.0, 8.0, 2.2] },
        { id: 157, name: 'Frites', cat: 'feculents', n: [312, 3.4, 41.0, 15.0, 3.8] },

        // === LÉGUMINEUSES ===
        { id: 170, name: 'Lentilles (cuites)', cat: 'legumineuses', n: [116, 9.0, 20.1, 0.4, 7.9] },
        { id: 171, name: 'Lentilles corail (cuites)', cat: 'legumineuses', n: [116, 9.0, 20.0, 0.4, 4.9] },
        { id: 172, name: 'Pois chiches (cuits)', cat: 'legumineuses', n: [164, 8.9, 27.4, 2.6, 7.6] },
        { id: 173, name: 'Haricots rouges (cuits)', cat: 'legumineuses', n: [127, 8.7, 22.8, 0.5, 6.4] },
        { id: 174, name: 'Haricots blancs (cuits)', cat: 'legumineuses', n: [139, 9.7, 25.1, 0.5, 6.3] },
        { id: 175, name: 'Fèves (cuites)', cat: 'legumineuses', n: [110, 7.6, 19.7, 0.4, 5.4] },
        { id: 176, name: 'Pois cassés (cuits)', cat: 'legumineuses', n: [118, 8.3, 21.1, 0.4, 8.3] },
        { id: 177, name: 'Edamame', cat: 'legumineuses', n: [121, 12.0, 8.9, 5.2, 5.2] },
        { id: 178, name: 'Tofu', cat: 'legumineuses', n: [76, 8.0, 1.9, 4.8, 0.3] },

        // === NOIX & GRAINES ===
        { id: 190, name: 'Amandes', cat: 'noix', n: [579, 21.2, 21.6, 49.9, 12.5] },
        { id: 191, name: 'Noix', cat: 'noix', n: [654, 15.2, 13.7, 65.2, 6.7] },
        { id: 192, name: 'Noisettes', cat: 'noix', n: [628, 15.0, 16.7, 60.8, 9.7] },
        { id: 193, name: 'Noix de cajou', cat: 'noix', n: [553, 18.2, 30.2, 43.9, 3.3] },
        { id: 194, name: 'Cacahuètes', cat: 'noix', n: [567, 25.8, 16.1, 49.2, 8.5] },
        { id: 195, name: 'Pistaches', cat: 'noix', n: [560, 20.2, 27.2, 45.3, 10.6] },
        { id: 196, name: 'Noix du Brésil', cat: 'noix', n: [656, 14.3, 12.3, 66.4, 7.5] },
        { id: 197, name: 'Noix de macadamia', cat: 'noix', n: [718, 7.9, 13.8, 75.8, 8.6] },
        { id: 198, name: 'Graines de tournesol', cat: 'noix', n: [584, 20.8, 20.0, 51.5, 8.6] },
        { id: 199, name: 'Graines de chia', cat: 'noix', n: [486, 17.0, 42.0, 31.0, 34.4] },
        { id: 200, name: 'Graines de lin', cat: 'noix', n: [534, 18.3, 28.9, 42.2, 27.3] },
        { id: 201, name: 'Graines de courge', cat: 'noix', n: [559, 30.2, 10.7, 49.1, 6.0] },
        { id: 202, name: 'Beurre de cacahuète', cat: 'noix', n: [588, 25.0, 20.0, 50.0, 6.0] },

        // === BOISSONS ===
        { id: 210, name: 'Eau', cat: 'boissons', n: [0, 0, 0, 0, 0] },
        { id: 211, name: 'Café (noir)', cat: 'boissons', n: [2, 0.1, 0, 0, 0] },
        { id: 212, name: 'Thé (nature)', cat: 'boissons', n: [1, 0, 0, 0, 0] },
        { id: 213, name: 'Jus d\'orange', cat: 'boissons', n: [45, 0.7, 10.4, 0.2, 0.2] },
        { id: 214, name: 'Jus de pomme', cat: 'boissons', n: [46, 0.1, 11.3, 0.1, 0.2] },
        { id: 215, name: 'Coca-Cola', cat: 'boissons', n: [42, 0, 10.6, 0, 0] },
        { id: 216, name: 'Coca-Cola Zero', cat: 'boissons', n: [0, 0, 0, 0, 0] },
        { id: 217, name: 'Lait d\'amande', cat: 'boissons', n: [24, 0.6, 3.0, 1.1, 0.5] },
        { id: 218, name: 'Lait de soja', cat: 'boissons', n: [33, 2.8, 1.5, 1.8, 0.4] },
        { id: 219, name: 'Lait d\'avoine', cat: 'boissons', n: [43, 0.3, 6.7, 1.5, 0.8] },
        { id: 220, name: 'Bière (33cl)', cat: 'boissons', n: [43, 0.5, 3.6, 0, 0] },
        { id: 221, name: 'Vin rouge', cat: 'boissons', n: [85, 0.1, 2.6, 0, 0] },
        { id: 222, name: 'Vin blanc', cat: 'boissons', n: [82, 0.1, 2.6, 0, 0] },

        // === MATIÈRES GRASSES ===
        { id: 230, name: 'Huile d\'olive', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 231, name: 'Huile de colza', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 232, name: 'Huile de coco', cat: 'matieres_grasses', n: [862, 0, 0, 100, 0] },
        { id: 233, name: 'Huile de tournesol', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 234, name: 'Margarine', cat: 'matieres_grasses', n: [717, 0.2, 0.7, 80.0, 0] },

        // === OEUFS ===
        { id: 240, name: 'Œuf entier', cat: 'laitiers', n: [155, 13.0, 1.1, 11.0, 0] },
        { id: 241, name: 'Blanc d\'œuf', cat: 'laitiers', n: [52, 11.0, 0.7, 0.2, 0] },
        { id: 242, name: 'Jaune d\'œuf', cat: 'laitiers', n: [322, 16.0, 3.6, 27.0, 0] },

        // === SNACKS ===
        { id: 250, name: 'Chocolat noir 70%', cat: 'snacks', n: [598, 7.8, 33.0, 43.0, 10.9] },
        { id: 251, name: 'Chocolat au lait', cat: 'snacks', n: [535, 7.6, 59.4, 30.0, 2.3] },
        { id: 252, name: 'Chocolat blanc', cat: 'snacks', n: [539, 6.0, 59.2, 32.1, 0] },
        { id: 253, name: 'Chips', cat: 'snacks', n: [536, 7.0, 53.0, 33.0, 4.4] },
        { id: 254, name: 'Biscuits secs', cat: 'snacks', n: [430, 7.0, 71.0, 14.0, 2.0] },
        { id: 255, name: 'Madeleine', cat: 'snacks', n: [450, 6.0, 50.0, 25.0, 1.0] },
        { id: 256, name: 'Croissant', cat: 'snacks', n: [406, 8.2, 45.0, 21.0, 2.0] },
        { id: 257, name: 'Pain au chocolat', cat: 'snacks', n: [420, 7.5, 46.0, 23.0, 2.5] },
        { id: 258, name: 'Brownie', cat: 'snacks', n: [466, 5.5, 54.0, 26.0, 2.8] },
        { id: 259, name: 'Glace vanille', cat: 'snacks', n: [207, 3.5, 24.0, 11.0, 0] },
        { id: 260, name: 'Compote de pomme', cat: 'snacks', n: [68, 0.3, 17.0, 0.1, 1.2] },
        { id: 261, name: 'Confiture', cat: 'snacks', n: [260, 0.3, 63.0, 0.1, 0.9] },
        { id: 262, name: 'Miel', cat: 'snacks', n: [304, 0.3, 82.0, 0, 0.2] },
        { id: 263, name: 'Nutella', cat: 'snacks', n: [539, 6.3, 57.5, 31.0, 3.4] },

        // === PETIT-DÉJEUNER ===
        { id: 270, name: 'Céréales (muesli)', cat: 'petit_dejeuner', n: [367, 9.4, 66.0, 6.1, 8.3] },
        { id: 271, name: 'Céréales (cornflakes)', cat: 'petit_dejeuner', n: [357, 7.0, 84.0, 0.9, 3.3] },
        { id: 272, name: 'Granola', cat: 'petit_dejeuner', n: [471, 10.0, 60.0, 20.0, 5.0] },
        { id: 273, name: 'Crêpe nature', cat: 'petit_dejeuner', n: [227, 6.7, 28.0, 10.0, 0.8] },
        { id: 274, name: 'Gaufre', cat: 'petit_dejeuner', n: [312, 7.0, 38.0, 14.0, 1.0] },
        { id: 275, name: 'Pancake', cat: 'petit_dejeuner', n: [227, 6.4, 28.0, 10.0, 0.8] },

        // === PLATS PRÉPARÉS ===
        { id: 280, name: 'Pizza Margherita', cat: 'plats', n: [266, 11.0, 33.0, 10.0, 2.3] },
        { id: 281, name: 'Pizza 4 fromages', cat: 'plats', n: [290, 14.0, 28.0, 14.0, 1.5] },
        { id: 282, name: 'Burger classique', cat: 'plats', n: [295, 17.0, 24.0, 14.0, 1.3] },
        { id: 283, name: 'Kebab', cat: 'plats', n: [215, 15.0, 18.0, 10.0, 1.5] },
        { id: 284, name: 'Sushi (6 pièces)', cat: 'plats', n: [150, 6.0, 25.0, 3.5, 0.5] },
        { id: 285, name: 'Quiche Lorraine', cat: 'plats', n: [300, 12.0, 19.0, 20.0, 0.8] },
        { id: 286, name: 'Croque-monsieur', cat: 'plats', n: [340, 16.0, 22.0, 21.0, 1.0] },
        { id: 287, name: 'Lasagnes', cat: 'plats', n: [188, 11.0, 17.0, 8.0, 1.5] },
        { id: 288, name: 'Couscous (plat complet)', cat: 'plats', n: [150, 8.0, 20.0, 4.0, 2.5] },
        { id: 289, name: 'Hachis parmentier', cat: 'plats', n: [140, 8.0, 12.0, 7.0, 1.5] },
        { id: 290, name: 'Gratin dauphinois', cat: 'plats', n: [150, 4.0, 13.0, 9.0, 1.2] },
        { id: 291, name: 'Ratatouille', cat: 'plats', n: [60, 1.2, 7.0, 3.0, 2.5] },
        { id: 292, name: 'Blanquette de veau', cat: 'plats', n: [120, 12.0, 5.0, 6.0, 0.5] },
        { id: 293, name: 'Bœuf bourguignon', cat: 'plats', n: [145, 14.0, 5.0, 8.0, 1.0] },
        { id: 294, name: 'Poulet rôti', cat: 'plats', n: [190, 27.0, 0, 8.0, 0] },
        { id: 295, name: 'Salade César', cat: 'plats', n: [170, 10.0, 8.0, 12.0, 1.5] },
        { id: 296, name: 'Salade Niçoise', cat: 'plats', n: [130, 8.0, 6.0, 9.0, 2.0] },
        { id: 297, name: 'Wrap poulet', cat: 'plats', n: [210, 13.0, 22.0, 8.0, 1.5] },
        { id: 298, name: 'Tacos', cat: 'plats', n: [250, 12.0, 25.0, 12.0, 2.0] },
        { id: 299, name: 'Pad thaï', cat: 'plats', n: [190, 8.0, 25.0, 7.0, 1.5] },

        // === SAUCES & CONDIMENTS ===
        { id: 310, name: 'Ketchup', cat: 'sauces', n: [112, 1.0, 26.0, 0.1, 0.3] },
        { id: 311, name: 'Moutarde', cat: 'sauces', n: [66, 4.4, 5.3, 3.3, 3.3] },
        { id: 312, name: 'Mayonnaise', cat: 'sauces', n: [680, 1.0, 0.6, 75.0, 0] },
        { id: 313, name: 'Vinaigrette', cat: 'sauces', n: [400, 0.1, 3.0, 43.0, 0] },
        { id: 314, name: 'Sauce soja', cat: 'sauces', n: [53, 8.0, 4.9, 0.6, 0.8] },
        { id: 315, name: 'Houmous', cat: 'sauces', n: [166, 8.0, 14.3, 9.6, 6.0] },
        { id: 316, name: 'Guacamole', cat: 'sauces', n: [160, 2.0, 9.0, 15.0, 7.0] },
        { id: 317, name: 'Sauce tomate', cat: 'sauces', n: [29, 1.3, 5.5, 0.2, 1.5] },
        { id: 318, name: 'Pesto', cat: 'sauces', n: [387, 4.6, 6.0, 38.0, 2.0] },
        { id: 319, name: 'Tzatziki', cat: 'sauces', n: [55, 3.0, 4.0, 3.0, 0.5] },
        { id: 320, name: 'Sucre blanc', cat: 'sauces', n: [400, 0, 100, 0, 0] },

        // === FRUITS (suite) ===
        { id: 400, name: 'Cassis', cat: 'fruits', n: [63, 1.4, 15.4, 0.4, 7.8] },
        { id: 401, name: 'Groseille', cat: 'fruits', n: [56, 1.4, 13.8, 0.2, 4.3] },
        { id: 402, name: 'Mûre', cat: 'fruits', n: [43, 1.4, 9.6, 0.5, 5.3] },
        { id: 403, name: 'Nectarine', cat: 'fruits', n: [44, 1.1, 10.6, 0.3, 1.7] },
        { id: 404, name: 'Papaye', cat: 'fruits', n: [43, 0.5, 10.8, 0.3, 1.7] },
        { id: 405, name: 'Fruit de la passion', cat: 'fruits', n: [97, 2.2, 23.4, 0.7, 10.4] },
        { id: 406, name: 'Noix de coco (chair)', cat: 'fruits', n: [354, 3.3, 15.2, 33.5, 9.0] },
        { id: 407, name: 'Datte séchée', cat: 'fruits', n: [282, 2.5, 75.0, 0.4, 8.0] },
        { id: 408, name: 'Rhubarbe', cat: 'fruits', n: [21, 0.9, 4.5, 0.2, 1.8] },
        { id: 409, name: 'Cranberry séchée', cat: 'fruits', n: [308, 0.1, 82.4, 1.4, 5.7] },
        { id: 410, name: 'Kaki', cat: 'fruits', n: [70, 0.6, 18.6, 0.2, 3.6] },
        { id: 411, name: 'Goyave', cat: 'fruits', n: [68, 2.6, 14.3, 1.0, 5.4] },
        { id: 412, name: 'Mirabelle', cat: 'fruits', n: [67, 0.7, 16.0, 0.2, 1.5] },
        { id: 413, name: 'Fruit du dragon', cat: 'fruits', n: [50, 1.1, 11.0, 0.4, 3.0] },
        { id: 414, name: 'Coing', cat: 'fruits', n: [57, 0.4, 15.3, 0.1, 1.9] },
        { id: 415, name: 'Raisin sec', cat: 'fruits', n: [299, 3.1, 79.2, 0.5, 3.7] },
        { id: 416, name: 'Pruneau', cat: 'fruits', n: [240, 2.2, 63.9, 0.4, 7.1] },
        { id: 417, name: 'Abricot sec', cat: 'fruits', n: [241, 3.4, 62.6, 0.5, 7.3] },
        { id: 418, name: 'Figue séchée', cat: 'fruits', n: [249, 3.3, 63.9, 0.9, 9.8] },
        { id: 419, name: 'Mangue séchée', cat: 'fruits', n: [314, 1.5, 78.6, 0.8, 2.4] },

        // === LÉGUMES (suite) ===
        { id: 420, name: 'Chou rouge', cat: 'legumes', n: [31, 1.4, 7.4, 0.2, 2.1] },
        { id: 421, name: 'Chou kale', cat: 'legumes', n: [49, 4.3, 8.8, 0.9, 3.6] },
        { id: 422, name: 'Chou de Bruxelles', cat: 'legumes', n: [43, 3.4, 9.0, 0.3, 3.8] },
        { id: 423, name: 'Pak choï', cat: 'legumes', n: [13, 1.5, 2.2, 0.2, 1.0] },
        { id: 424, name: 'Courge butternut', cat: 'legumes', n: [45, 1.0, 11.7, 0.1, 2.0] },
        { id: 425, name: 'Potiron', cat: 'legumes', n: [26, 1.0, 6.5, 0.1, 0.5] },
        { id: 426, name: 'Potimarron', cat: 'legumes', n: [63, 1.7, 13.4, 0.5, 2.5] },
        { id: 427, name: 'Topinambour', cat: 'legumes', n: [73, 2.0, 17.4, 0.0, 1.6] },
        { id: 428, name: 'Panais', cat: 'legumes', n: [75, 1.2, 18.0, 0.3, 4.9] },
        { id: 429, name: 'Rutabaga', cat: 'legumes', n: [37, 1.1, 8.6, 0.2, 2.3] },
        { id: 430, name: 'Chou romanesco', cat: 'legumes', n: [25, 2.0, 4.7, 0.2, 2.1] },
        { id: 431, name: 'Cresson', cat: 'legumes', n: [11, 2.3, 1.3, 0.1, 0.5] },
        { id: 432, name: 'Roquette', cat: 'legumes', n: [25, 2.6, 3.7, 0.7, 1.6] },
        { id: 433, name: 'Mâche', cat: 'legumes', n: [21, 2.0, 3.6, 0.4, 1.8] },
        { id: 434, name: 'Blette', cat: 'legumes', n: [19, 1.8, 3.7, 0.2, 1.6] },
        { id: 435, name: 'Cœur de palmier', cat: 'legumes', n: [28, 2.5, 4.6, 0.6, 2.4] },
        { id: 436, name: 'Pousse de bambou', cat: 'legumes', n: [27, 2.6, 5.2, 0.3, 2.2] },
        { id: 437, name: 'Gingembre frais', cat: 'legumes', n: [80, 1.8, 17.8, 0.8, 2.0] },
        { id: 438, name: 'Cornichon', cat: 'legumes', n: [14, 0.3, 2.3, 0.2, 1.2] },
        { id: 439, name: 'Olive verte', cat: 'legumes', n: [145, 1.0, 3.8, 15.3, 3.3] },
        { id: 440, name: 'Olive noire', cat: 'legumes', n: [115, 0.8, 6.3, 11.0, 3.2] },
        { id: 441, name: 'Piment rouge', cat: 'legumes', n: [40, 1.9, 8.8, 0.4, 1.5] },
        { id: 442, name: 'Citrouille', cat: 'legumes', n: [26, 1.0, 6.5, 0.1, 0.5] },
        { id: 443, name: 'Patisson', cat: 'legumes', n: [18, 1.2, 3.8, 0.2, 1.0] },

        // === VIANDES (suite) ===
        { id: 450, name: 'Filet mignon de porc', cat: 'viandes', n: [120, 22.0, 0, 3.0, 0] },
        { id: 451, name: 'Rôti de veau', cat: 'viandes', n: [175, 30.0, 0, 6.0, 0] },
        { id: 452, name: 'Côte de bœuf', cat: 'viandes', n: [250, 25.0, 0, 17.0, 0] },
        { id: 453, name: 'Bavette de bœuf', cat: 'viandes', n: [155, 28.0, 0, 5.0, 0] },
        { id: 454, name: 'Onglet de bœuf', cat: 'viandes', n: [150, 27.0, 0, 4.5, 0] },
        { id: 455, name: 'Tournedos', cat: 'viandes', n: [180, 29.0, 0, 7.0, 0] },
        { id: 456, name: 'Carpaccio de bœuf', cat: 'viandes', n: [130, 22.0, 0, 5.0, 0] },
        { id: 457, name: 'Pintade', cat: 'viandes', n: [158, 23.0, 0, 6.5, 0] },
        { id: 458, name: 'Caille', cat: 'viandes', n: [192, 25.0, 0, 10.0, 0] },
        { id: 459, name: 'Steak de cheval', cat: 'viandes', n: [133, 21.0, 0, 5.0, 0] },

        // === CHARCUTERIE ===
        { id: 460, name: 'Foie gras', cat: 'charcuterie', n: [462, 11.0, 4.7, 44.0, 0] },
        { id: 461, name: 'Boudin noir', cat: 'charcuterie', n: [379, 14.6, 1.3, 35.0, 0] },
        { id: 462, name: 'Boudin blanc', cat: 'charcuterie', n: [230, 10.0, 8.0, 18.0, 0] },
        { id: 463, name: 'Pâté de campagne', cat: 'charcuterie', n: [320, 13.0, 3.0, 29.0, 0] },
        { id: 464, name: 'Rillettes', cat: 'charcuterie', n: [480, 15.0, 0, 46.0, 0] },
        { id: 465, name: 'Chorizo', cat: 'charcuterie', n: [455, 24.0, 2.0, 39.0, 0] },
        { id: 466, name: 'Rosette', cat: 'charcuterie', n: [400, 27.0, 1.5, 32.0, 0] },
        { id: 467, name: 'Coppa', cat: 'charcuterie', n: [380, 28.0, 0.5, 29.0, 0] },
        { id: 468, name: 'Bresaola', cat: 'charcuterie', n: [151, 32.0, 0, 2.6, 0] },
        { id: 469, name: 'Mortadelle', cat: 'charcuterie', n: [311, 16.0, 1.5, 27.0, 0] },
        { id: 470, name: 'Saucisse de Toulouse', cat: 'charcuterie', n: [310, 15.0, 1.0, 27.0, 0] },
        { id: 471, name: 'Andouillette', cat: 'charcuterie', n: [220, 18.0, 0.5, 16.0, 0] },
        { id: 472, name: 'Viande des Grisons', cat: 'charcuterie', n: [148, 37.0, 0.5, 1.5, 0] },
        { id: 473, name: 'Terrine de canard', cat: 'charcuterie', n: [335, 14.0, 2.0, 31.0, 0] },
        { id: 474, name: 'Mousse de foie', cat: 'charcuterie', n: [310, 12.0, 4.0, 28.0, 0] },

        // === POISSONS (suite) ===
        { id: 480, name: 'Lieu noir', cat: 'poissons', n: [81, 19.0, 0, 0.6, 0] },
        { id: 481, name: 'Colin', cat: 'poissons', n: [82, 17.0, 0, 1.0, 0] },
        { id: 482, name: 'Merlu', cat: 'poissons', n: [86, 17.0, 0, 1.8, 0] },
        { id: 483, name: 'Turbot', cat: 'poissons', n: [95, 16.0, 0, 3.2, 0] },
        { id: 484, name: 'Lotte', cat: 'poissons', n: [76, 15.0, 0, 1.5, 0] },
        { id: 485, name: 'Saint-Jacques', cat: 'poissons', n: [69, 12.1, 3.2, 0.5, 0] },
        { id: 486, name: 'Huîtres', cat: 'poissons', n: [81, 9.0, 4.7, 2.3, 0] },
        { id: 487, name: 'Langoustine', cat: 'poissons', n: [90, 20.6, 0.6, 0.8, 0] },
        { id: 488, name: 'Homard', cat: 'poissons', n: [89, 19.0, 0, 1.0, 0] },
        { id: 489, name: 'Crabe', cat: 'poissons', n: [97, 19.4, 0, 1.8, 0] },
        { id: 490, name: 'Anchois', cat: 'poissons', n: [131, 20.4, 0, 4.8, 0] },
        { id: 491, name: 'Hareng', cat: 'poissons', n: [158, 18.0, 0, 9.0, 0] },
        { id: 492, name: 'Hareng fumé', cat: 'poissons', n: [217, 21.0, 0, 14.5, 0] },
        { id: 493, name: 'Anguille', cat: 'poissons', n: [236, 18.4, 0, 17.8, 0] },
        { id: 494, name: 'Espadon', cat: 'poissons', n: [144, 19.7, 0, 6.7, 0] },
        { id: 495, name: 'Poulpe', cat: 'poissons', n: [82, 15.0, 2.2, 1.0, 0] },
        { id: 496, name: 'Raie', cat: 'poissons', n: [95, 21.5, 0, 0.7, 0] },
        { id: 497, name: 'Flétan', cat: 'poissons', n: [111, 22.5, 0, 2.3, 0] },
        { id: 498, name: 'Perche', cat: 'poissons', n: [91, 19.4, 0, 0.9, 0] },
        { id: 499, name: 'Brochet', cat: 'poissons', n: [88, 19.3, 0, 0.7, 0] },

        // === FROMAGES ===
        { id: 500, name: 'Raclette', cat: 'fromages', n: [357, 23.0, 0.5, 29.0, 0] },
        { id: 501, name: 'Reblochon', cat: 'fromages', n: [313, 20.0, 0.5, 26.0, 0] },
        { id: 502, name: 'Beaufort', cat: 'fromages', n: [401, 27.0, 1.0, 33.0, 0] },
        { id: 503, name: 'Cantal', cat: 'fromages', n: [365, 23.0, 2.0, 30.0, 0] },
        { id: 504, name: 'Gruyère', cat: 'fromages', n: [413, 27.0, 0.4, 33.0, 0] },
        { id: 505, name: 'Saint-Nectaire', cat: 'fromages', n: [340, 24.0, 0.5, 27.0, 0] },
        { id: 506, name: 'Munster', cat: 'fromages', n: [327, 21.0, 0.5, 27.0, 0] },
        { id: 507, name: 'Bleu d\'Auvergne', cat: 'fromages', n: [353, 21.0, 1.0, 30.0, 0] },
        { id: 508, name: 'Tomme de Savoie', cat: 'fromages', n: [342, 22.0, 1.0, 28.0, 0] },
        { id: 509, name: 'Feta', cat: 'fromages', n: [264, 14.2, 4.1, 21.3, 0] },
        { id: 510, name: 'Mascarpone', cat: 'fromages', n: [429, 4.8, 3.5, 44.0, 0] },
        { id: 511, name: 'Ricotta', cat: 'fromages', n: [174, 11.3, 3.0, 13.0, 0] },
        { id: 512, name: 'Petit-suisse', cat: 'fromages', n: [112, 7.0, 3.5, 8.0, 0] },
        { id: 513, name: 'Fromage à tartiner', cat: 'fromages', n: [253, 8.5, 3.5, 23.0, 0] },
        { id: 514, name: 'Boursin', cat: 'fromages', n: [370, 8.0, 2.5, 37.0, 0] },
        { id: 515, name: 'Coulommiers', cat: 'fromages', n: [310, 19.0, 0.5, 26.0, 0] },
        { id: 516, name: 'Maroilles', cat: 'fromages', n: [331, 22.0, 0.5, 27.0, 0] },
        { id: 517, name: 'Pont-l\'Évêque', cat: 'fromages', n: [312, 20.0, 0.5, 26.0, 0] },
        { id: 518, name: 'Ossau-Iraty', cat: 'fromages', n: [390, 25.0, 0.5, 32.0, 0] },
        { id: 519, name: 'Mimolette', cat: 'fromages', n: [355, 24.0, 1.0, 28.0, 0] },
        { id: 520, name: 'Gouda', cat: 'fromages', n: [356, 25.0, 2.2, 27.4, 0] },
        { id: 521, name: 'Yaourt à la grecque', cat: 'laitiers', n: [97, 9.0, 3.6, 5.0, 0] },
        { id: 522, name: 'Kéfir', cat: 'laitiers', n: [41, 3.3, 4.7, 1.0, 0] },
        { id: 523, name: 'Lait concentré sucré', cat: 'laitiers', n: [321, 8.1, 54.4, 8.7, 0] },
        { id: 524, name: 'Lait de brebis', cat: 'laitiers', n: [108, 5.6, 5.1, 7.0, 0] },

        // === FÉCULENTS & CÉRÉALES (suite) ===
        { id: 530, name: 'Riz basmati (cuit)', cat: 'feculents', n: [121, 3.5, 25.2, 0.4, 0.4] },
        { id: 531, name: 'Riz sauvage (cuit)', cat: 'feculents', n: [101, 4.0, 21.3, 0.3, 1.8] },
        { id: 532, name: 'Nouilles chinoises (cuites)', cat: 'feculents', n: [138, 4.5, 25.0, 2.0, 1.0] },
        { id: 533, name: 'Nouilles de riz (cuites)', cat: 'feculents', n: [109, 0.9, 25.0, 0.2, 1.0] },
        { id: 534, name: 'Gnocchi', cat: 'feculents', n: [133, 3.0, 27.0, 1.0, 1.5] },
        { id: 535, name: 'Polenta', cat: 'feculents', n: [85, 2.0, 17.0, 1.0, 1.0] },
        { id: 536, name: 'Épeautre (cuit)', cat: 'cereales', n: [127, 5.5, 26.4, 0.9, 3.9] },
        { id: 537, name: 'Sarrasin (cuit)', cat: 'cereales', n: [92, 3.4, 20.0, 0.6, 2.7] },
        { id: 538, name: 'Millet (cuit)', cat: 'cereales', n: [119, 3.5, 23.7, 1.0, 1.3] },
        { id: 539, name: 'Galette de riz', cat: 'feculents', n: [387, 7.0, 82.0, 2.8, 3.0] },
        { id: 540, name: 'Pain aux céréales', cat: 'feculents', n: [260, 10.0, 46.0, 4.5, 5.5] },
        { id: 541, name: 'Pain de seigle', cat: 'feculents', n: [259, 8.5, 48.3, 3.3, 5.8] },
        { id: 542, name: 'Bagel', cat: 'feculents', n: [275, 10.5, 53.0, 1.6, 2.3] },
        { id: 543, name: 'Naan', cat: 'feculents', n: [290, 8.7, 50.0, 5.5, 2.1] },
        { id: 544, name: 'Pain pita', cat: 'feculents', n: [275, 9.1, 55.7, 1.2, 2.2] },
        { id: 545, name: 'Focaccia', cat: 'feculents', n: [271, 7.4, 34.0, 11.0, 1.6] },
        { id: 546, name: 'Brioche', cat: 'feculents', n: [357, 8.0, 49.0, 14.0, 1.5] },
        { id: 547, name: 'Amarante (cuit)', cat: 'cereales', n: [102, 3.8, 18.7, 1.6, 2.1] },
        { id: 548, name: 'Orge (cuit)', cat: 'cereales', n: [123, 2.3, 28.2, 0.4, 3.8] },
        { id: 549, name: 'Sorgho (cuit)', cat: 'cereales', n: [120, 3.5, 25.0, 1.0, 1.6] },

        // === LÉGUMINEUSES (suite) ===
        { id: 550, name: 'Tempeh', cat: 'legumineuses', n: [192, 20.3, 7.6, 10.8, 0] },
        { id: 551, name: 'Soja (graines cuites)', cat: 'legumineuses', n: [173, 16.6, 9.9, 9.0, 6.0] },
        { id: 552, name: 'Flageolets (cuits)', cat: 'legumineuses', n: [116, 7.6, 20.0, 0.6, 6.5] },
        { id: 553, name: 'Falafel', cat: 'legumineuses', n: [333, 13.3, 31.8, 17.8, 3.5] },
        { id: 554, name: 'Protéines de soja texturées', cat: 'legumineuses', n: [327, 52.0, 30.0, 1.2, 4.5] },
        { id: 555, name: 'Azukis (cuits)', cat: 'legumineuses', n: [128, 7.5, 25.0, 0.1, 7.3] },
        { id: 556, name: 'Mogettes (cuites)', cat: 'legumineuses', n: [130, 8.2, 23.0, 0.5, 7.0] },
        { id: 557, name: 'Seitan', cat: 'vegetarien', n: [370, 75.0, 14.0, 1.9, 0.6] },

        // === NOIX & GRAINES (suite) ===
        { id: 560, name: 'Noix de pécan', cat: 'noix', n: [691, 9.2, 13.9, 72.0, 9.6] },
        { id: 561, name: 'Pignon de pin', cat: 'noix', n: [673, 13.7, 13.1, 68.4, 3.7] },
        { id: 562, name: 'Noix de coco râpée', cat: 'noix', n: [660, 6.9, 23.7, 64.5, 16.3] },
        { id: 563, name: 'Tahini', cat: 'noix', n: [595, 17.0, 21.2, 53.8, 9.3] },
        { id: 564, name: 'Purée d\'amande', cat: 'noix', n: [614, 21.0, 18.6, 55.0, 6.5] },
        { id: 565, name: 'Graines de sésame', cat: 'noix', n: [573, 17.7, 23.5, 49.7, 11.8] },
        { id: 566, name: 'Graines de chanvre', cat: 'noix', n: [553, 31.6, 8.7, 48.8, 4.0] },
        { id: 567, name: 'Mix trail (fruits secs & noix)', cat: 'noix', n: [462, 13.0, 47.0, 27.0, 5.0] },

        // === BOISSONS (suite) ===
        { id: 570, name: 'Lait de coco', cat: 'boissons', n: [197, 2.0, 2.7, 21.3, 0] },
        { id: 571, name: 'Eau de coco', cat: 'boissons', n: [19, 0.7, 3.7, 0.2, 1.1] },
        { id: 572, name: 'Kombucha', cat: 'boissons', n: [17, 0, 4.0, 0, 0] },
        { id: 573, name: 'Orangina', cat: 'boissons', n: [42, 0, 10.2, 0, 0] },
        { id: 574, name: 'Sirop de menthe (dilué)', cat: 'boissons', n: [28, 0, 7.0, 0, 0] },
        { id: 575, name: 'Chocolat chaud', cat: 'boissons', n: [77, 3.5, 10.0, 2.5, 0.7] },
        { id: 576, name: 'Cappuccino', cat: 'boissons', n: [45, 2.5, 3.8, 2.3, 0] },
        { id: 577, name: 'Latte', cat: 'boissons', n: [56, 3.0, 4.9, 2.5, 0] },
        { id: 578, name: 'Thé matcha latte', cat: 'boissons', n: [48, 2.0, 5.5, 2.0, 0.3] },
        { id: 579, name: 'Cidre', cat: 'boissons', n: [50, 0, 6.0, 0, 0] },
        { id: 580, name: 'Champagne', cat: 'boissons', n: [76, 0.1, 1.3, 0, 0] },
        { id: 581, name: 'Smoothie fruits', cat: 'boissons', n: [54, 0.6, 12.5, 0.3, 1.0] },
        { id: 582, name: 'Limonade', cat: 'boissons', n: [40, 0, 10.0, 0, 0] },
        { id: 583, name: 'Ice tea', cat: 'boissons', n: [32, 0, 7.8, 0, 0] },
        { id: 584, name: 'Jus de pamplemousse', cat: 'boissons', n: [39, 0.5, 9.2, 0.1, 0.1] },
        { id: 585, name: 'Jus de raisin', cat: 'boissons', n: [60, 0.4, 14.8, 0.1, 0.2] },
        { id: 586, name: 'Jus de tomate', cat: 'boissons', n: [17, 0.8, 3.6, 0.1, 0.4] },

        // === MATIÈRES GRASSES (suite) ===
        { id: 590, name: 'Huile de sésame', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 591, name: 'Huile de lin', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 592, name: 'Huile de noix', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 593, name: 'Huile d\'arachide', cat: 'matieres_grasses', n: [884, 0, 0, 100, 0] },
        { id: 594, name: 'Graisse de canard', cat: 'matieres_grasses', n: [882, 0, 0, 99.8, 0] },
        { id: 595, name: 'Ghee', cat: 'matieres_grasses', n: [900, 0.3, 0, 99.5, 0] },
        { id: 596, name: 'Beurre demi-sel', cat: 'matieres_grasses', n: [717, 0.9, 0.1, 81.0, 0] },
        { id: 597, name: 'Beurre allégé 41%', cat: 'matieres_grasses', n: [378, 0.5, 0.5, 41.0, 0] },

        // === DESSERTS ===
        { id: 600, name: 'Macaron', cat: 'desserts', n: [393, 6.0, 53.0, 17.0, 1.5] },
        { id: 601, name: 'Éclair au chocolat', cat: 'desserts', n: [262, 5.5, 24.0, 16.0, 1.0] },
        { id: 602, name: 'Tarte aux pommes', cat: 'desserts', n: [237, 2.5, 34.0, 10.0, 1.5] },
        { id: 603, name: 'Tiramisu', cat: 'desserts', n: [283, 4.5, 28.0, 17.0, 0.5] },
        { id: 604, name: 'Crème brûlée', cat: 'desserts', n: [263, 4.5, 24.0, 17.0, 0] },
        { id: 605, name: 'Panna cotta', cat: 'desserts', n: [243, 3.0, 22.0, 16.0, 0] },
        { id: 606, name: 'Mousse au chocolat', cat: 'desserts', n: [205, 4.6, 21.0, 11.0, 1.5] },
        { id: 607, name: 'Fondant au chocolat', cat: 'desserts', n: [390, 5.5, 39.0, 24.0, 2.0] },
        { id: 608, name: 'Gâteau au yaourt', cat: 'desserts', n: [300, 5.0, 40.0, 13.0, 0.5] },
        { id: 609, name: 'Flan pâtissier', cat: 'desserts', n: [200, 5.0, 28.0, 8.0, 0.3] },
        { id: 610, name: 'Profiterole', cat: 'desserts', n: [295, 5.5, 28.0, 18.0, 0.5] },
        { id: 611, name: 'Mille-feuille', cat: 'desserts', n: [349, 5.0, 33.0, 22.0, 0.5] },
        { id: 612, name: 'Cookie', cat: 'desserts', n: [488, 5.5, 64.0, 24.0, 2.0] },
        { id: 613, name: 'Financier', cat: 'desserts', n: [440, 8.0, 42.0, 27.0, 1.5] },
        { id: 614, name: 'Cannelé', cat: 'desserts', n: [340, 5.0, 48.0, 14.0, 0.5] },
        { id: 615, name: 'Sorbet', cat: 'desserts', n: [120, 0.3, 30.0, 0.1, 0.5] },
        { id: 616, name: 'Tarte au citron', cat: 'desserts', n: [312, 4.5, 40.0, 15.0, 0.5] },
        { id: 617, name: 'Clafoutis', cat: 'desserts', n: [190, 5.0, 25.0, 8.0, 1.2] },
        { id: 618, name: 'Crème caramel', cat: 'desserts', n: [143, 3.0, 23.0, 4.5, 0] },
        { id: 619, name: 'Paris-Brest', cat: 'desserts', n: [415, 8.0, 32.0, 29.0, 1.0] },
        { id: 620, name: 'Opéra', cat: 'desserts', n: [380, 6.0, 38.0, 23.0, 1.5] },
        { id: 621, name: 'Tarte tatin', cat: 'desserts', n: [250, 2.5, 38.0, 10.0, 1.5] },
        { id: 622, name: 'Île flottante', cat: 'desserts', n: [130, 5.0, 18.0, 4.5, 0] },
        { id: 623, name: 'Riz au lait', cat: 'desserts', n: [128, 3.5, 21.0, 3.5, 0.2] },

        // === SNACKS (suite) ===
        { id: 625, name: 'Pop-corn sucré', cat: 'snacks', n: [420, 6.0, 72.0, 14.0, 10.0] },
        { id: 626, name: 'Pop-corn salé', cat: 'snacks', n: [387, 13.0, 78.0, 5.0, 15.0] },
        { id: 627, name: 'Barre de céréales', cat: 'snacks', n: [410, 6.5, 64.0, 15.0, 4.0] },
        { id: 628, name: 'Bretzels', cat: 'snacks', n: [338, 9.0, 68.0, 3.5, 2.8] },
        { id: 629, name: 'Crackers', cat: 'snacks', n: [410, 9.0, 62.0, 14.0, 2.5] },
        { id: 630, name: 'Crêpe au Nutella', cat: 'snacks', n: [342, 5.5, 42.0, 17.0, 1.5] },

        // === CONFISERIES ===
        { id: 631, name: 'Bonbons gélifiés', cat: 'confiseries', n: [343, 6.5, 77.0, 0.5, 0] },
        { id: 632, name: 'Caramel mou', cat: 'confiseries', n: [382, 2.0, 72.0, 10.0, 0] },
        { id: 633, name: 'Nougat', cat: 'confiseries', n: [400, 5.0, 68.0, 13.0, 1.0] },
        { id: 634, name: 'Pâte de fruit', cat: 'confiseries', n: [300, 0.5, 75.0, 0.1, 1.5] },
        { id: 635, name: 'Réglisse', cat: 'confiseries', n: [313, 3.0, 69.0, 3.0, 0.5] },
        { id: 636, name: 'Meringue', cat: 'confiseries', n: [394, 5.0, 93.0, 0.2, 0] },
        { id: 637, name: 'Chamallow', cat: 'confiseries', n: [318, 1.8, 81.0, 0, 0] },
        { id: 638, name: 'Sucette', cat: 'confiseries', n: [392, 0, 98.0, 0, 0] },

        // === PETIT-DÉJEUNER (suite) ===
        { id: 640, name: 'Pain perdu', cat: 'petit_dejeuner', n: [243, 7.0, 27.0, 12.0, 0.8] },
        { id: 641, name: 'Porridge', cat: 'petit_dejeuner', n: [71, 2.5, 12.0, 1.5, 1.7] },
        { id: 642, name: 'Muffin anglais', cat: 'petit_dejeuner', n: [227, 8.0, 44.0, 2.0, 1.5] },
        { id: 643, name: 'Smoothie bowl', cat: 'petit_dejeuner', n: [120, 3.0, 22.0, 2.0, 3.5] },
        { id: 644, name: 'Açai bowl', cat: 'petit_dejeuner', n: [168, 3.5, 28.0, 5.0, 4.5] },
        { id: 645, name: 'Overnight oats', cat: 'petit_dejeuner', n: [154, 5.0, 24.0, 4.0, 3.0] },
        { id: 646, name: 'Banana bread', cat: 'petit_dejeuner', n: [326, 4.5, 48.0, 13.0, 1.5] },
        { id: 647, name: 'Tartine beurrée', cat: 'petit_dejeuner', n: [357, 7.5, 44.0, 17.0, 2.0] },
        { id: 648, name: 'Scone', cat: 'petit_dejeuner', n: [362, 7.0, 52.0, 14.0, 1.5] },

        // === FAST FOOD ===
        { id: 650, name: 'Big Mac', cat: 'fast_food', n: [257, 13.0, 20.0, 14.0, 1.5] },
        { id: 651, name: 'McChicken', cat: 'fast_food', n: [250, 11.0, 24.0, 13.0, 1.0] },
        { id: 652, name: 'Chicken McNuggets (6)', cat: 'fast_food', n: [259, 14.0, 16.0, 16.0, 1.0] },
        { id: 653, name: 'Royal Cheese', cat: 'fast_food', n: [270, 14.0, 21.0, 15.0, 1.0] },
        { id: 654, name: 'Whopper', cat: 'fast_food', n: [260, 13.0, 18.0, 15.0, 1.0] },
        { id: 655, name: 'Frites McDonald\'s', cat: 'fast_food', n: [323, 3.4, 42.0, 16.0, 3.5] },
        { id: 656, name: 'Panini poulet', cat: 'fast_food', n: [230, 14.0, 22.0, 10.0, 1.5] },
        { id: 657, name: 'Hot-dog', cat: 'fast_food', n: [247, 10.0, 18.0, 15.0, 0.5] },
        { id: 658, name: 'Sandwich club', cat: 'fast_food', n: [260, 15.0, 25.0, 12.0, 2.0] },
        { id: 659, name: 'Cordon bleu', cat: 'fast_food', n: [264, 15.0, 14.0, 17.0, 0.5] },
        { id: 660, name: 'Nuggets de poulet', cat: 'fast_food', n: [296, 15.0, 18.0, 18.0, 1.0] },
        { id: 661, name: 'Donuts', cat: 'fast_food', n: [421, 5.0, 49.0, 23.0, 1.0] },

        // === PLATS (suite) ===
        { id: 670, name: 'Chili con carne', cat: 'plats', n: [120, 8.5, 10.0, 5.0, 3.5] },
        { id: 671, name: 'Paella', cat: 'plats', n: [155, 10.0, 18.0, 5.0, 1.0] },
        { id: 672, name: 'Risotto', cat: 'plats', n: [140, 4.0, 22.0, 4.0, 0.5] },
        { id: 673, name: 'Pâtes carbonara', cat: 'plats', n: [190, 10.0, 22.0, 7.5, 1.0] },
        { id: 674, name: 'Pâtes bolognaise', cat: 'plats', n: [160, 9.0, 18.0, 6.0, 1.5] },
        { id: 675, name: 'Gratin de pâtes', cat: 'plats', n: [185, 9.0, 20.0, 8.0, 1.0] },
        { id: 676, name: 'Tartiflette', cat: 'plats', n: [200, 9.0, 14.0, 12.0, 1.0] },
        { id: 677, name: 'Pot-au-feu', cat: 'plats', n: [85, 8.0, 5.0, 3.5, 1.5] },
        { id: 678, name: 'Cassoulet', cat: 'plats', n: [160, 11.0, 12.0, 8.0, 4.0] },
        { id: 679, name: 'Choucroute garnie', cat: 'plats', n: [140, 8.0, 5.0, 10.0, 3.0] },
        { id: 680, name: 'Omelette nature', cat: 'plats', n: [154, 11.0, 0.6, 12.0, 0] },
        { id: 681, name: 'Œufs brouillés', cat: 'plats', n: [148, 10.0, 1.6, 11.0, 0] },
        { id: 682, name: 'Shakshuka', cat: 'plats', n: [110, 7.0, 8.0, 6.0, 2.0] },
        { id: 683, name: 'Galette complète', cat: 'plats', n: [210, 11.0, 17.0, 11.0, 1.5] },
        { id: 684, name: 'Steak frites', cat: 'plats', n: [250, 18.0, 22.0, 11.0, 2.0] },
        { id: 685, name: 'Fish & chips', cat: 'plats', n: [240, 12.0, 24.0, 12.0, 2.0] },
        { id: 686, name: 'Sandwich jambon beurre', cat: 'plats', n: [280, 13.0, 30.0, 12.0, 1.5] },
        { id: 687, name: 'Croque-madame', cat: 'plats', n: [370, 18.0, 22.0, 23.0, 1.0] },
        { id: 688, name: 'Moussaka', cat: 'plats', n: [145, 8.0, 10.0, 8.0, 2.0] },
        { id: 689, name: 'Poulet basquaise', cat: 'plats', n: [135, 16.0, 4.0, 6.0, 1.5] },
        { id: 690, name: 'Bœuf stroganoff', cat: 'plats', n: [175, 15.0, 6.0, 10.0, 0.5] },
        { id: 691, name: 'Brandade de morue', cat: 'plats', n: [175, 10.0, 12.0, 10.0, 1.0] },

        // === PLATS ETHNIQUES ===
        { id: 700, name: 'Soupe miso', cat: 'ethnique', n: [33, 2.0, 3.3, 1.0, 0.5] },
        { id: 701, name: 'Curry de poulet', cat: 'ethnique', n: [150, 14.0, 6.0, 8.0, 1.5] },
        { id: 702, name: 'Tikka masala', cat: 'ethnique', n: [165, 13.0, 8.0, 10.0, 1.5] },
        { id: 703, name: 'Dahl de lentilles', cat: 'ethnique', n: [104, 6.3, 14.5, 2.5, 4.5] },
        { id: 704, name: 'Nems (2 pièces)', cat: 'ethnique', n: [230, 7.0, 22.0, 13.0, 1.5] },
        { id: 705, name: 'Samosas (2 pièces)', cat: 'ethnique', n: [260, 5.0, 28.0, 15.0, 2.0] },
        { id: 706, name: 'Fried rice', cat: 'ethnique', n: [163, 4.0, 24.0, 6.0, 1.0] },
        { id: 707, name: 'Bo bun', cat: 'ethnique', n: [160, 10.0, 22.0, 4.0, 2.0] },
        { id: 708, name: 'Pho', cat: 'ethnique', n: [50, 4.0, 5.0, 1.5, 0.5] },
        { id: 709, name: 'Ramen', cat: 'ethnique', n: [190, 10.0, 22.0, 7.0, 1.0] },
        { id: 710, name: 'Poulet tandoori', cat: 'ethnique', n: [148, 24.0, 3.0, 4.5, 0.5] },
        { id: 711, name: 'Wok de légumes', cat: 'ethnique', n: [65, 2.5, 7.0, 3.0, 2.5] },
        { id: 712, name: 'Dim sum', cat: 'ethnique', n: [200, 8.0, 22.0, 9.0, 1.0] },
        { id: 713, name: 'Fajitas', cat: 'ethnique', n: [180, 12.0, 18.0, 7.0, 2.0] },
        { id: 714, name: 'Burrito', cat: 'ethnique', n: [210, 10.0, 26.0, 8.0, 3.0] },
        { id: 715, name: 'Porc au caramel', cat: 'ethnique', n: [200, 14.0, 12.0, 11.0, 0.5] },
        { id: 716, name: 'Bibimbap', cat: 'ethnique', n: [160, 8.0, 24.0, 4.0, 2.0] },
        { id: 717, name: 'Gyoza (6 pièces)', cat: 'ethnique', n: [210, 8.5, 24.0, 9.0, 1.0] },

        // === SOUPES ===
        { id: 720, name: 'Soupe à l\'oignon', cat: 'plats', n: [45, 1.5, 5.5, 2.0, 0.8] },
        { id: 721, name: 'Minestrone', cat: 'plats', n: [55, 2.5, 8.0, 1.5, 2.0] },
        { id: 722, name: 'Velouté de potiron', cat: 'plats', n: [42, 0.8, 6.5, 1.5, 0.8] },
        { id: 723, name: 'Velouté de champignons', cat: 'plats', n: [65, 1.5, 5.0, 4.5, 0.5] },
        { id: 724, name: 'Gaspacho', cat: 'plats', n: [46, 0.7, 4.5, 2.8, 0.7] },
        { id: 725, name: 'Soupe de poisson', cat: 'plats', n: [55, 5.0, 4.0, 2.0, 0.5] },
        { id: 726, name: 'Taboulé', cat: 'plats', n: [160, 3.0, 22.0, 7.0, 2.0] },

        // === SAUCES & CONDIMENTS (suite) ===
        { id: 730, name: 'Sauce BBQ', cat: 'sauces', n: [172, 1.0, 40.0, 0.6, 0.5] },
        { id: 731, name: 'Sauce aigre-douce', cat: 'sauces', n: [150, 0.3, 37.0, 0.1, 0.5] },
        { id: 732, name: 'Harissa', cat: 'sauces', n: [77, 2.5, 10.0, 3.0, 4.0] },
        { id: 733, name: 'Sauce béchamel', cat: 'sauces', n: [130, 3.5, 8.0, 9.5, 0.2] },
        { id: 734, name: 'Sauce hollandaise', cat: 'sauces', n: [580, 3.0, 0.5, 63.0, 0] },
        { id: 735, name: 'Sauce poivre', cat: 'sauces', n: [90, 1.5, 5.0, 7.0, 0.3] },
        { id: 736, name: 'Aïoli', cat: 'sauces', n: [620, 2.0, 2.5, 66.0, 0.3] },
        { id: 737, name: 'Tapenade', cat: 'sauces', n: [340, 2.0, 4.0, 35.0, 3.5] },
        { id: 738, name: 'Sirop d\'érable', cat: 'sauces', n: [260, 0, 67.0, 0.1, 0] },
        { id: 739, name: 'Sauce teriyaki', cat: 'sauces', n: [89, 5.9, 15.6, 0, 0.1] },
        { id: 740, name: 'Sauce samurai', cat: 'sauces', n: [520, 0.8, 8.0, 54.0, 0.5] },
        { id: 741, name: 'Coulis de tomate', cat: 'sauces', n: [32, 1.5, 5.0, 0.5, 1.5] },
        { id: 742, name: 'Sauce curry', cat: 'sauces', n: [110, 1.5, 8.0, 8.0, 1.0] },
        { id: 743, name: 'Sauce nuoc mam', cat: 'sauces', n: [35, 5.0, 3.7, 0, 0] },
        { id: 744, name: 'Sauce sriracha', cat: 'sauces', n: [93, 2.0, 19.0, 1.0, 2.0] },

        // === PRODUITS VÉGÉTARIENS ===
        { id: 750, name: 'Steak de soja', cat: 'vegetarien', n: [180, 18.0, 10.0, 8.0, 3.0] },
        { id: 751, name: 'Galette de légumes', cat: 'vegetarien', n: [170, 4.0, 18.0, 9.0, 3.0] },
        { id: 752, name: 'Nuggets végétaux', cat: 'vegetarien', n: [230, 14.0, 18.0, 12.0, 3.0] },
        { id: 753, name: 'Saucisse végétale', cat: 'vegetarien', n: [200, 18.0, 8.0, 11.0, 3.0] },
        { id: 754, name: 'Lait de riz', cat: 'vegetarien', n: [47, 0.3, 9.2, 1.0, 0] },
        { id: 755, name: 'Yaourt de soja', cat: 'vegetarien', n: [50, 4.0, 2.0, 2.5, 0.5] },
        { id: 756, name: 'Fromage végétal', cat: 'vegetarien', n: [260, 2.0, 20.0, 19.0, 1.0] },
        { id: 757, name: 'Houmous de betterave', cat: 'vegetarien', n: [150, 6.0, 15.0, 8.0, 4.0] },
        { id: 758, name: 'Burger végétal', cat: 'vegetarien', n: [220, 16.0, 15.0, 11.0, 4.0] },
    ],

    // Poids unitaire en grammes pour les aliments courants
    // Chaque entrée = poids par défaut réaliste pour UNE unité/portion standard.
    // Ordre : id: poids_en_g, triés par catégorie.
    unitWeights: {
        // Fruits (1-24) — par pièce ou portion
        1: 180, 2: 120, 3: 180, 4: 12, 5: 5, 6: 180, 7: 150, 8: 300, 9: 200, 10: 75,
        11: 8, 12: 50, 13: 400, 14: 300, 15: 2, 16: 4, 17: 70, 18: 60, 19: 200, 20: 15,
        21: 150, 22: 50, 23: 300, 24: 100,

        // Légumes (30-56) — par pièce ou portion
        30: 80, 31: 120, 32: 100, 33: 200, 34: 250, 35: 150, 36: 150,
        37: 150, 38: 150, 42: 20, 43: 100, 52: 300, 53: 20,

        // Viandes (60-75)
        60: 150, 61: 150, 62: 150, 63: 125, 64: 125, 65: 200, 66: 150,
        67: 150, 68: 150, 69: 200, 71: 150, 72: 300, 73: 200, 74: 30, 75: 30,

        // Poissons (90-95)
        90: 125, 91: 150, 92: 150, 93: 100, 94: 100, 95: 200,

        // Laitiers — laits (110-112) = 1 verre
        110: 200, 111: 200, 112: 200,
        // Laitiers — yaourts / fromage blanc (113-116)
        113: 125, 114: 125, 115: 100, 116: 100,
        // Fromages à pâte (117-124) = 1 portion
        117: 30, 118: 30, 119: 30, 120: 30, 121: 60, 122: 15, 123: 30, 124: 30,
        // Crèmes / beurre / Skyr / cottage (125-129)
        125: 30, 126: 30, 127: 10, 128: 150, 129: 100,

        // Féculents & céréales (140-157)
        140: 200, 141: 200, 142: 200, 143: 200, 144: 170, 145: 200,
        // Pains (146-149)
        146: 30, 147: 30, 148: 25, 149: 65,
        150: 200, 151: 200, 152: 200, 153: 200, 154: 50,
        155: 10, 156: 40, 157: 150,

        // Légumineuses (170-175)
        170: 180, 171: 180, 172: 180, 173: 180, 174: 180, 175: 180,

        // Noix & graines (190-202) = poignée
        190: 25, 191: 25, 192: 25, 193: 25, 194: 25, 195: 25, 196: 20,
        197: 20, 198: 15, 199: 15, 200: 15, 201: 20, 202: 15,

        // Matières grasses (230-234) = 1 c. à soupe / 1 noix
        230: 10, 231: 10, 232: 10, 233: 10, 234: 10,

        // Œufs (240-242) — 1 œuf = 50g comestible
        240: 50, 241: 30, 242: 18,

        // Snacks individuels (250-263)
        250: 20, 251: 20, 252: 20, 253: 30, 254: 12, 255: 30, 256: 60,
        257: 45, 258: 50, 259: 100, 260: 100, 261: 15, 262: 15, 263: 15,

        // Petit-déjeuner (270-275) = 1 bol à sec / 1 pièce
        270: 40, 271: 30, 272: 40, 273: 50, 274: 75, 275: 50,

        // Plats préparés (280-299) = 1 portion servie
        280: 130, 281: 130, 282: 200, 283: 250, 284: 150, 285: 150,
        286: 150, 287: 300, 288: 350, 289: 300, 290: 200, 291: 200,
        292: 250, 293: 250, 294: 150, 295: 200, 296: 200, 297: 200,
        298: 150, 299: 300,

        // Boissons (300-303) = 1 verre
        300: 30, 301: 200, 302: 300, 303: 200,

        // Plats ethniques (400-403) = 1 portion
        400: 200, 401: 200, 402: 300, 403: 250,

        // Fast-food (500-503)
        500: 250, 501: 300, 502: 250, 503: 250,

        // Sauces & condiments (600-603) = 1 c. à soupe
        600: 15, 601: 15, 602: 15, 603: 15,

        // Laitiers (suite) & féculents (suite)
        522: 200, 523: 20, 524: 200,
        530: 200, 531: 200, 532: 200, 533: 200, 534: 200, 535: 200,
        539: 10, 540: 35, 541: 35, 542: 80, 543: 100, 544: 60, 640: 100,

        // Plats (700-703)
        700: 350, 701: 350, 702: 350, 703: 300,

        // Charcuterie (460-469) = 1 tranche ou portion
        460: 30, 461: 80, 462: 80, 463: 30, 464: 30, 465: 15, 466: 20,
        467: 20, 468: 25, 469: 25,

        // Desserts divers (256-260) dupes supprimés ci-dessus

        // Végétarien (750-758)
        750: 150, 751: 125, 752: 150, 753: 150, 758: 150
    },

    // Poids par défaut par catégorie (fallback si l'id n'est pas dans unitWeights)
    // Doses volontairement conservatrices pour éviter la surestimation.
    categoryWeights: {
        fruits: 150, legumes: 120, viandes: 150, poissons: 150,
        laitiers: 100, feculents: 150, legumineuses: 180, noix: 25,
        boissons: 200, matieres_grasses: 10, snacks: 30, plats: 300,
        petit_dejeuner: 50, sauces: 15, charcuterie: 30, fromages: 30,
        desserts: 80, fast_food: 200, ethnique: 300, vegetarien: 150,
        cereales: 40, confiseries: 15
    },

    getUnitWeight(food) {
        if (food.u) return food.u;
        if (this.unitWeights[food.id]) return this.unitWeights[food.id];
        return this.categoryWeights[food.cat] || 100;
    },

    search(query) {
        if (!query || query.length < 2) return [];
        const normalize = str => str.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const q = normalize(query);
        const words = q.split(/\s+/).filter(w => w.length >= 2);

        if (words.length === 0) return [];

        // First: try exact substring match
        let results = this.foods.filter(f => {
            const name = normalize(f.name);
            return name.includes(q);
        });

        // Second: if no exact match, try matching ALL words individually
        if (results.length === 0 && words.length > 1) {
            results = this.foods.filter(f => {
                const name = normalize(f.name);
                return words.every(w => name.includes(w));
            });
        }

        // Third: if still no match, try matching the FIRST word (most significant)
        if (results.length === 0) {
            results = this.foods.filter(f => {
                const name = normalize(f.name);
                return name.includes(words[0]);
            });
        }

        // Include custom foods in search
        const customFoods = Storage.getCustomFoods();
        const customResults = customFoods.filter(f => normalize(f.name).includes(q));
        results = [...results, ...customResults];

        // Score and sort: prioritize word-start/exact matches over substring-in-middle
        const wordBoundary = new RegExp('(?:^|\\s|\\b)' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        results.sort((a, b) => {
            const na = normalize(a.name), nb = normalize(b.name);
            // Priority 1: name equals query exactly
            const aExact = na === q ? 0 : 1;
            const bExact = nb === q ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;
            // Priority 2: first word of name IS the query (e.g. "riz" → "riz blanc" over "riz au lait")
            const aFirstWord = na.split(/[\s(]/)[0] === q ? 0 : 1;
            const bFirstWord = nb.split(/[\s(]/)[0] === q ? 0 : 1;
            if (aFirstWord !== bFirstWord) return aFirstWord - bFirstWord;
            // Priority 3: name starts with query
            const aStarts = na.startsWith(q) ? 0 : 1;
            const bStarts = nb.startsWith(q) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            // Priority 4: prefer staple foods (feculents, viandes, legumes) over desserts/boissons
            const stapleCats = ['feculents', 'viandes', 'poissons', 'legumes', 'oeufs'];
            const aStaple = stapleCats.includes(a.cat) ? 0 : 1;
            const bStaple = stapleCats.includes(b.cat) ? 0 : 1;
            if (aStaple !== bStaple) return aStaple - bStaple;
            // Priority 5: query matches at word boundary
            const aWord = wordBoundary.test(na) ? 0 : 1;
            const bWord = wordBoundary.test(nb) ? 0 : 1;
            if (aWord !== bWord) return aWord - bWord;
            // Priority 6: shorter name = more relevant
            return na.length - nb.length;
        });

        return results.slice(0, 30);
    },

    getByCategory(catId) {
        if (catId === 'all') return this.foods;
        return this.foods.filter(f => f.cat === catId);
    },

    _index: null,

    _buildIndex() {
        this._index = new Map();
        for (const food of this.foods) {
            this._index.set(food.id, food);
        }
    },

    getById(id) {
        // Check custom foods first for string IDs
        if (typeof id === 'string' && id.startsWith('custom_')) {
            return Storage.getCustomFoods().find(f => f.id === id);
        }
        if (!this._index) this._buildIndex();
        return this._index.get(id) || null;
    },

    getNutrition(food, grams) {
        const factor = grams / 100;
        return {
            calories: Math.round(food.n[0] * factor),
            protein: Math.round(food.n[1] * factor * 10) / 10,
            carbs: Math.round(food.n[2] * factor * 10) / 10,
            fat: Math.round(food.n[3] * factor * 10) / 10,
            fiber: Math.round(food.n[4] * factor * 10) / 10
        };
    }
};
