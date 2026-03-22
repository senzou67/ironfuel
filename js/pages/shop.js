const ShopPage = {
    categories: [
        {
            name: 'Vêtements',
            icon: '👕',
            items: [
                { id: 'clothes_bandana', type: 'clothes', name: 'Bandana', price: 20, emoji: '🎀', tier: 1 },
                { id: 'clothes_tank', type: 'clothes', name: 'Débardeur Sport', price: 35, emoji: '👕', tier: 1 },
                { id: 'clothes_hoodie', type: 'clothes', name: 'Hoodie', price: 60, emoji: '🧥', tier: 1 },
                { id: 'clothes_gi', type: 'clothes', name: 'Kimono', price: 120, emoji: '🥋', tier: 2 },
                { id: 'clothes_armor_light', type: 'clothes', name: 'Armure Légère', price: 200, emoji: '🛡️', tier: 2 },
                { id: 'clothes_cape', type: 'clothes', name: 'Cape Héroïque', price: 350, emoji: '🦸', tier: 3 },
                { id: 'clothes_royal', type: 'clothes', name: 'Tenue Royale', price: 600, emoji: '👑', tier: 3 },
                { id: 'clothes_legendary', type: 'clothes', name: 'Armure Légendaire', price: 1200, emoji: '⚜️', tier: 4 }
            ]
        },
        {
            name: 'Ailes',
            icon: '🪽',
            items: [
                { id: 'wings_feather', type: 'wings', name: 'Plumes Légères', price: 40, emoji: '🕊️', tier: 1 },
                { id: 'wings_bat', type: 'wings', name: 'Ailes de Chauve-souris', price: 100, emoji: '🦇', tier: 1 },
                { id: 'wings_flame', type: 'wings', name: 'Ailes de Feu', price: 250, emoji: '🔥', tier: 2 },
                { id: 'wings_crystal', type: 'wings', name: 'Ailes Cristallines', price: 400, emoji: '💎', tier: 2 },
                { id: 'wings_shadow', type: 'wings', name: 'Ailes d\'Ombre', price: 700, emoji: '🌑', tier: 3 },
                { id: 'wings_angel', type: 'wings', name: 'Ailes d\'Ange', price: 1200, emoji: '👼', tier: 3 },
                { id: 'wings_divine', type: 'wings', name: 'Ailes Divines', price: 2500, emoji: '✨', tier: 4 }
            ]
        },
        {
            name: 'Auras',
            icon: '🔮',
            items: [
                { id: 'aura_mist', type: 'aura', name: 'Brume', price: 30, emoji: '🌫️', tier: 1 },
                { id: 'aura_wind', type: 'aura', name: 'Vent', price: 60, emoji: '🌪️', tier: 1 },
                { id: 'aura_fire', type: 'aura', name: 'Feu', price: 200, emoji: '🔥', tier: 2 },
                { id: 'aura_lightning', type: 'aura', name: 'Foudre', price: 350, emoji: '⚡', tier: 2 },
                { id: 'aura_shadow', type: 'aura', name: 'Ombre', price: 500, emoji: '🌑', tier: 3 },
                { id: 'aura_cosmos', type: 'aura', name: 'Cosmos', price: 800, emoji: '🌌', tier: 3 },
                { id: 'aura_divine', type: 'aura', name: 'Divin', price: 1500, emoji: '💫', tier: 4 }
            ]
        },
        {
            name: 'Compagnons',
            icon: '🐾',
            items: [
                { id: 'pet_mouse', type: 'pet', name: 'Souris', price: 25, emoji: '🐭', tier: 1 },
                { id: 'pet_bird', type: 'pet', name: 'Oiseau', price: 50, emoji: '🐦', tier: 1 },
                { id: 'pet_wolf', type: 'pet', name: 'Loup', price: 150, emoji: '🐺', tier: 2 },
                { id: 'pet_eagle', type: 'pet', name: 'Aigle', price: 300, emoji: '🦅', tier: 2 },
                { id: 'pet_phoenix', type: 'pet', name: 'Phénix', price: 700, emoji: '🔥', tier: 3 },
                { id: 'pet_dragon', type: 'pet', name: 'Dragon', price: 1200, emoji: '🐲', tier: 3 },
                { id: 'pet_cerberus', type: 'pet', name: 'Cerbère', price: 2500, emoji: '🐕', tier: 4 }
            ]
        },
        {
            name: 'Titres',
            icon: '🏷️',
            items: [
                { id: 'title_rookie', type: 'title', name: 'Débutant', price: 0, emoji: '🏷️', tier: 1 },
                { id: 'title_warrior', type: 'title', name: 'Guerrier', price: 50, emoji: '⚔️', tier: 1 },
                { id: 'title_champion', type: 'title', name: 'Champion', price: 150, emoji: '🏆', tier: 2 },
                { id: 'title_legend', type: 'title', name: 'Légende', price: 400, emoji: '🌟', tier: 3 },
                { id: 'title_titan', type: 'title', name: 'Titan', price: 800, emoji: '🗿', tier: 3 },
                { id: 'title_god', type: 'title', name: 'Divin', price: 2000, emoji: '👑', tier: 4 }
            ]
        }
    ],

    _refreshCallback: null,

    // Premium SVG icons for shop items (replaces emojis)
    _svgIcons: {
        // Vêtements
        clothes_bandana: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gBand" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E53935"/><stop offset="100%" stop-color="#C62828"/></linearGradient></defs><path d="M4 14c0-2 3-6 12-6s12 4 12 6l-3 4c-2-3-5-4-9-4s-7 1-9 4z" fill="url(#gBand)"/><path d="M7 18l-3-4M25 18l3-4" stroke="#B71C1C" stroke-width="1.5" fill="none"/><circle cx="16" cy="12" r="1.5" fill="#FFCDD2" opacity="0.6"/></svg>`,
        clothes_tank: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTank" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#42A5F5"/><stop offset="100%" stop-color="#1565C0"/></linearGradient></defs><path d="M10 8h12v2l2 2v14H8V12l2-2z" fill="url(#gTank)" rx="2"/><path d="M10 8c0-2 2-3 6-3s6 1 6 3" stroke="#0D47A1" stroke-width="1.2" fill="none"/><line x1="16" y1="10" x2="16" y2="24" stroke="#1E88E5" stroke-width="0.5" opacity="0.3"/></svg>`,
        clothes_hoodie: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gHood" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#78909C"/><stop offset="100%" stop-color="#37474F"/></linearGradient></defs><path d="M8 12l-2 3v11h20V15l-2-3c0-4-4-6-8-6s-8 2-8 6z" fill="url(#gHood)"/><path d="M12 6c0 0 1 3 4 3s4-3 4-3" stroke="#546E7A" stroke-width="1.2" fill="none"/><ellipse cx="16" cy="18" rx="3" ry="2" fill="#455A64"/></svg>`,
        clothes_gi: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gGi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5F5F5"/><stop offset="100%" stop-color="#E0E0E0"/></linearGradient></defs><path d="M8 8h16v20H8z" fill="url(#gGi)" rx="1"/><path d="M12 8v6l4 2 4-2V8" fill="none" stroke="#9E9E9E" stroke-width="1.2"/><rect x="13" y="15" width="6" height="2" rx="1" fill="#212121"/></svg>`,
        clothes_armor_light: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gArL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B0BEC5"/><stop offset="100%" stop-color="#607D8B"/></linearGradient></defs><path d="M8 10c0-2 4-4 8-4s8 2 8 4v14c0 2-3 4-8 4s-8-2-8-4z" fill="url(#gArL)"/><path d="M12 10v12M20 10v12M8 16h16" stroke="#455A64" stroke-width="0.8" opacity="0.4"/><circle cx="16" cy="14" r="3" fill="none" stroke="#90A4AE" stroke-width="1"/></svg>`,
        clothes_cape: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gCape" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7B1FA2"/><stop offset="100%" stop-color="#4A148C"/></linearGradient></defs><path d="M10 6h12c0 0 2 10 4 20H6C8 16 10 6 10 6z" fill="url(#gCape)"/><path d="M10 6h12" stroke="#CE93D8" stroke-width="2" stroke-linecap="round"/><path d="M12 12c2 2 6 2 8 0" stroke="#9C27B0" stroke-width="0.8" fill="none" opacity="0.5"/></svg>`,
        clothes_royal: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gRoy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFD54F"/><stop offset="100%" stop-color="#FF8F00"/></linearGradient></defs><path d="M8 10h16v16H8z" fill="url(#gRoy)" rx="2"/><path d="M8 10c0-3 4-5 8-5s8 2 8 5" fill="none" stroke="#F57F17" stroke-width="1.5"/><rect x="14" y="14" width="4" height="4" rx="1" fill="#FFF8E1" opacity="0.8"/><circle cx="16" cy="7" r="2" fill="#FFD54F"/></svg>`,
        clothes_legendary: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gLeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#FFA000"/><stop offset="100%" stop-color="#FFD700"/></linearGradient></defs><path d="M7 8c0-2 4-4 9-4s9 2 9 4v16c0 3-4 5-9 5s-9-2-9-5z" fill="url(#gLeg)"/><path d="M11 10v14M21 10v14M7 16h18" stroke="#E65100" stroke-width="0.7" opacity="0.4"/><path d="M13 12l3 3 3-3" fill="none" stroke="#FFF8E1" stroke-width="1.5"/><circle cx="16" cy="20" r="2" fill="#FFF8E1" opacity="0.6"/></svg>`,
        // Ailes
        wings_feather: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gFth" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E0E0E0"/><stop offset="100%" stop-color="#9E9E9E"/></linearGradient></defs><path d="M16 4c-4 4-10 8-10 14 3-2 7-3 10-8 3 5 7 6 10 8C26 12 20 8 16 4z" fill="url(#gFth)"/><path d="M16 4v20" stroke="#BDBDBD" stroke-width="0.8"/></svg>`,
        wings_bat: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gBat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#424242"/><stop offset="100%" stop-color="#212121"/></linearGradient></defs><path d="M16 8L4 16c1-1 3 0 5-2 0 3 2 4 4 3l3-3 3 3c2 1 4 0 4-3 2 2 4 1 5 2z" fill="url(#gBat)"/><circle cx="16" cy="10" r="1.5" fill="#616161"/></svg>`,
        wings_flame: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gFlW" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#E53935"/><stop offset="50%" stop-color="#FF9800"/><stop offset="100%" stop-color="#FFD54F"/></linearGradient></defs><path d="M16 6C12 10 4 14 4 20c4-3 8-2 12-8 4 6 8 5 12 8 0-6-8-10-12-14z" fill="url(#gFlW)" opacity="0.9"/><path d="M16 6v18" stroke="#FFAB40" stroke-width="0.6" opacity="0.5"/></svg>`,
        wings_crystal: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gCry" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#B3E5FC"/><stop offset="50%" stop-color="#4FC3F7"/><stop offset="100%" stop-color="#0288D1"/></linearGradient></defs><path d="M16 6L4 18l6-2 6-4 6 4 6 2z" fill="url(#gCry)" opacity="0.85"/><path d="M16 6l-6 8M16 6l6 8M10 14l-6 4M22 14l6 4" stroke="#B3E5FC" stroke-width="0.6" fill="none"/></svg>`,
        wings_shadow: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gShW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A148C"/><stop offset="100%" stop-color="#1A0033"/></linearGradient></defs><path d="M16 6C10 10 2 14 2 22c5-4 9-3 14-10 5 7 9 6 14 10 0-8-8-12-14-16z" fill="url(#gShW)" opacity="0.9"/><circle cx="16" cy="12" r="2" fill="#7C4DFF" opacity="0.4"/></svg>`,
        wings_angel: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gAng" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E3F2FD"/></linearGradient></defs><path d="M16 4C10 8 2 12 2 22c4-4 8-4 14-10 6 6 10 6 14 10 0-10-8-14-14-18z" fill="url(#gAng)"/><path d="M8 14c2-1 4 0 5 1M24 14c-2-1-4 0-5 1" stroke="#90CAF9" stroke-width="0.8" fill="none"/></svg>`,
        wings_divine: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gDiv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD54F"/><stop offset="50%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#FFD54F"/></linearGradient></defs><path d="M16 2C8 8 0 12 0 24c6-6 10-5 16-14 6 9 10 8 16 14 0-12-8-16-16-22z" fill="url(#gDiv)"/><circle cx="16" cy="10" r="3" fill="#FFF9C4" opacity="0.6"/><path d="M16 2v22" stroke="#FFD54F" stroke-width="0.5" opacity="0.4"/></svg>`,
        // Auras
        aura_mist: `<svg width="28" height="28" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="#B0BEC5" stroke-width="2" opacity="0.5" stroke-dasharray="3 3"/><circle cx="16" cy="16" r="8" fill="#CFD8DC" opacity="0.15"/></svg>`,
        aura_wind: `<svg width="28" height="28" viewBox="0 0 32 32"><path d="M6 12c4-2 8 0 12-2s6-4 10-2" stroke="#81D4FA" stroke-width="1.5" fill="none"/><path d="M4 18c4-2 8 0 12-2s6-4 10-2" stroke="#4FC3F7" stroke-width="1.5" fill="none"/><path d="M6 24c4-2 8 0 12-2s6-4 8-2" stroke="#29B6F6" stroke-width="1.5" fill="none"/></svg>`,
        aura_fire: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gAuF" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#E53935"/><stop offset="100%" stop-color="#FFD54F"/></linearGradient></defs><circle cx="16" cy="16" r="12" fill="none" stroke="url(#gAuF)" stroke-width="2.5" opacity="0.6"/><circle cx="16" cy="16" r="8" fill="#FF5722" opacity="0.1"/></svg>`,
        aura_lightning: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gAuL" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FDD835"/><stop offset="100%" stop-color="#F9A825"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="none" stroke="url(#gAuL)" stroke-width="2" opacity="0.5"/><path d="M14 8l-2 8h5l-3 10 6-12h-5z" fill="#FDD835" opacity="0.7"/></svg>`,
        aura_shadow: `<svg width="28" height="28" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#1A1A2E" opacity="0.4"/><circle cx="16" cy="16" r="12" fill="none" stroke="#4A148C" stroke-width="2" opacity="0.6"/><circle cx="16" cy="16" r="6" fill="#311B92" opacity="0.15"/></svg>`,
        aura_cosmos: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gAuC" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A237E"/><stop offset="50%" stop-color="#4A148C"/><stop offset="100%" stop-color="#0D47A1"/></linearGradient></defs><circle cx="16" cy="16" r="12" fill="url(#gAuC)" opacity="0.25"/><circle cx="16" cy="16" r="12" fill="none" stroke="#7C4DFF" stroke-width="1.5" opacity="0.5"/><circle cx="10" cy="10" r="1" fill="#FFF"/><circle cx="22" cy="12" r="0.8" fill="#FFF"/><circle cx="14" cy="22" r="0.6" fill="#FFF"/><circle cx="21" cy="20" r="1" fill="#E1BEE7" opacity="0.8"/></svg>`,
        aura_divine: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gAuD" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD54F"/><stop offset="50%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#FFD54F"/></linearGradient></defs><circle cx="16" cy="16" r="13" fill="none" stroke="url(#gAuD)" stroke-width="2.5" opacity="0.6"/><circle cx="16" cy="16" r="8" fill="#FFF8E1" opacity="0.1"/><path d="M16 4v2M16 26v2M4 16h2M26 16h2M7 7l1.5 1.5M23.5 23.5l1.5 1.5M7 25l1.5-1.5M23.5 8.5l1.5-1.5" stroke="#FFD54F" stroke-width="1" opacity="0.5"/></svg>`,
        // Compagnons
        pet_mouse: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gMou" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#BDBDBD"/><stop offset="100%" stop-color="#757575"/></linearGradient></defs><ellipse cx="16" cy="18" rx="8" ry="6" fill="url(#gMou)"/><circle cx="11" cy="11" r="4" fill="#E0E0E0"/><circle cx="21" cy="11" r="4" fill="#E0E0E0"/><circle cx="11" cy="11" r="2.5" fill="#F8BBD0"/><circle cx="21" cy="11" r="2.5" fill="#F8BBD0"/><circle cx="14" cy="17" r="1" fill="#212121"/><circle cx="18" cy="17" r="1" fill="#212121"/><ellipse cx="16" cy="19" rx="1.5" ry="1" fill="#F48FB1"/><path d="M24 18c3 0 6 1 6 0s-2-2-4-1" stroke="#9E9E9E" stroke-width="1" fill="none"/></svg>`,
        pet_bird: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gBrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#64B5F6"/><stop offset="100%" stop-color="#1E88E5"/></linearGradient></defs><ellipse cx="16" cy="16" rx="7" ry="8" fill="url(#gBrd)"/><circle cx="16" cy="11" r="5" fill="#90CAF9"/><circle cx="14" cy="10" r="1" fill="#212121"/><circle cx="18" cy="10" r="1" fill="#212121"/><path d="M16 12l2 2h-4z" fill="#FF8F00"/><path d="M9 16c-4 0-5 2-3 4" stroke="#42A5F5" stroke-width="1.5" fill="none"/><path d="M23 16c4 0 5 2 3 4" stroke="#42A5F5" stroke-width="1.5" fill="none"/><path d="M13 24l-1 3M19 24l1 3" stroke="#FF8F00" stroke-width="1.2"/></svg>`,
        pet_wolf: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gWlf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#78909C"/><stop offset="100%" stop-color="#37474F"/></linearGradient></defs><ellipse cx="16" cy="18" rx="8" ry="7" fill="url(#gWlf)"/><path d="M10 12L7 4l5 6z" fill="#546E7A"/><path d="M22 12l3-8-5 6z" fill="#546E7A"/><circle cx="13" cy="15" r="1.5" fill="#FFD54F"/><circle cx="19" cy="15" r="1.5" fill="#FFD54F"/><circle cx="13" cy="15" r="0.6" fill="#212121"/><circle cx="19" cy="15" r="0.6" fill="#212121"/><ellipse cx="16" cy="19" rx="2" ry="1.2" fill="#263238"/><path d="M14 20l-1 1M18 20l1 1" stroke="#90A4AE" stroke-width="0.5"/></svg>`,
        pet_eagle: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gEag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5D4037"/><stop offset="100%" stop-color="#3E2723"/></linearGradient></defs><ellipse cx="16" cy="16" rx="6" ry="8" fill="url(#gEag)"/><circle cx="16" cy="10" r="4.5" fill="#4E342E"/><circle cx="16" cy="10" r="3" fill="#F5F5F5"/><circle cx="15" cy="9.5" r="1" fill="#212121"/><circle cx="17" cy="9.5" r="1" fill="#212121"/><path d="M16 12l1.5 2h-3z" fill="#FDD835"/><path d="M10 14C4 12 2 16 4 20" stroke="#6D4C41" stroke-width="2" fill="none"/><path d="M22 14c6-2 8 2 6 6" stroke="#6D4C41" stroke-width="2" fill="none"/></svg>`,
        pet_phoenix: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gPhx" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#E53935"/><stop offset="40%" stop-color="#FF9800"/><stop offset="100%" stop-color="#FFD54F"/></linearGradient></defs><ellipse cx="16" cy="16" rx="6" ry="7" fill="url(#gPhx)"/><circle cx="16" cy="10" r="4" fill="#FFAB40"/><circle cx="14.5" cy="9.5" r="0.8" fill="#212121"/><circle cx="17.5" cy="9.5" r="0.8" fill="#212121"/><path d="M16 6c-1-3-3-4-4-3 1 1 2 3 4 5M16 6c1-3 3-4 4-3-1 1-2 3-4 5" fill="#FFD54F" opacity="0.8"/><path d="M10 14C4 12 2 18 6 22" stroke="#FF5722" stroke-width="2" fill="none"/><path d="M22 14c6-2 8 4 4 8" stroke="#FF5722" stroke-width="2" fill="none"/><path d="M14 23c-1 3-2 5 0 5M18 23c1 3 2 5 0 5" stroke="#E53935" stroke-width="1.2" fill="none"/></svg>`,
        pet_dragon: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gDrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#388E3C"/><stop offset="100%" stop-color="#1B5E20"/></linearGradient></defs><ellipse cx="16" cy="17" rx="7" ry="8" fill="url(#gDrg)"/><circle cx="16" cy="10" r="5" fill="#2E7D32"/><circle cx="13.5" cy="9" r="1.2" fill="#FFD54F"/><circle cx="18.5" cy="9" r="1.2" fill="#FFD54F"/><circle cx="13.5" cy="9" r="0.5" fill="#212121"/><circle cx="18.5" cy="9" r="0.5" fill="#212121"/><path d="M13 5l-2-3 3 2zM19 5l2-3-3 2z" fill="#4CAF50"/><path d="M9 15C4 13 3 18 5 21" stroke="#2E7D32" stroke-width="2" fill="none"/><path d="M23 15c5-2 6 3 4 6" stroke="#2E7D32" stroke-width="2" fill="none"/><path d="M14 13h4" stroke="#1B5E20" stroke-width="0.8"/></svg>`,
        pet_cerberus: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gCer" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#424242"/><stop offset="100%" stop-color="#1A1A1A"/></linearGradient></defs><ellipse cx="16" cy="20" rx="9" ry="7" fill="url(#gCer)"/><circle cx="8" cy="11" r="4" fill="#333"/><circle cx="16" cy="9" r="4.5" fill="#333"/><circle cx="24" cy="11" r="4" fill="#333"/><circle cx="7" cy="10.5" r="1" fill="#F44336"/><circle cx="9" cy="10.5" r="1" fill="#F44336"/><circle cx="15" cy="8.5" r="1.2" fill="#F44336"/><circle cx="17" cy="8.5" r="1.2" fill="#F44336"/><circle cx="23" cy="10.5" r="1" fill="#F44336"/><circle cx="25" cy="10.5" r="1" fill="#F44336"/></svg>`,
        // Titres
        title_rookie: `<svg width="28" height="28" viewBox="0 0 32 32"><rect x="6" y="10" width="20" height="14" rx="3" fill="#616161"/><rect x="8" y="12" width="16" height="10" rx="2" fill="none" stroke="#9E9E9E" stroke-width="0.8"/><circle cx="16" cy="17" r="3" fill="none" stroke="#BDBDBD" stroke-width="1.2"/></svg>`,
        title_warrior: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTW" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E64A19"/><stop offset="100%" stop-color="#BF360C"/></linearGradient></defs><path d="M16 4l-6 8h4v12h4V12h4z" fill="url(#gTW)"/><path d="M10 12l-4 4M22 12l4 4" stroke="#E64A19" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        title_champion: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFD54F"/><stop offset="100%" stop-color="#FFB300"/></linearGradient></defs><path d="M8 6h16v10c0 5-3.5 8-8 10-4.5-2-8-5-8-10z" fill="url(#gTC)"/><path d="M16 12v6M13 15h6" stroke="#FFF8E1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        title_legend: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTL" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#FFA000"/></linearGradient></defs><path d="M16 2l4 9h10l-8 6 3 10-9-7-9 7 3-10-8-6h10z" fill="url(#gTL)"/></svg>`,
        title_titan: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#CE93D8"/><stop offset="100%" stop-color="#6A1B9A"/></linearGradient></defs><path d="M16 2l5 10h10l-8 6 3 10-10-7-10 7 3-10-8-6h10z" fill="url(#gTT)"/><circle cx="16" cy="14" r="3" fill="#E1BEE7" opacity="0.5"/></svg>`,
        title_god: `<svg width="28" height="28" viewBox="0 0 32 32"><defs><linearGradient id="gTG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD700"/><stop offset="50%" stop-color="#FFF8E1"/><stop offset="100%" stop-color="#FFD700"/></linearGradient></defs><circle cx="16" cy="16" r="12" fill="none" stroke="url(#gTG)" stroke-width="2"/><path d="M10 14l3-8 3 6 3-6 3 8" fill="none" stroke="url(#gTG)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="20" r="2" fill="#FFD54F"/></svg>`
    },

    _getIcon(itemId, emoji) {
        return this._svgIcons[itemId] || `<span style="font-size:24px">${emoji}</span>`;
    },

    render() {
        const content = document.getElementById('page-content');
        content.innerHTML = `<div class="shop-container fade-in">${this.renderContent()}</div>`;
    },

    renderContent(embedded) {
        const coins = Storage.getCoins();
        return `
            ${!embedded ? `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
                    <h2 style="font-size:18px;margin:0">Personnalise ta créature</h2>
                    <div class="shop-coins-badge"><span>${coins}</span> <span>🪙</span></div>
                </div>
                <div class="shop-avatar-preview">${Creature.render()}</div>
            ` : ''}

            ${coins === 0 ? `
                <div style="background:var(--primary-light);border:1px solid var(--primary);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text);line-height:1.5">
                    <strong style="color:var(--primary)">Comment gagner des IronCoins ?</strong><br>
                    Ajoute un repas <strong>+5 🪙</strong> &bull; Bois un verre d'eau <strong>+2 🪙</strong> &bull; Atteins ton objectif calories <strong>+10 🪙</strong>
                </div>
            ` : ''}

            ${this.categories.map(cat => `
                <div class="shop-category">
                    <div class="shop-category-title">${cat.icon} ${cat.name}</div>
                    <div class="shop-items-grid">
                        ${cat.items.map(item => this._renderItem(item, coins)).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    },

    _renderItem(item, coins) {
        const owned = Storage.isItemOwned(item.id);
        const equipped = Storage.isItemEquipped(item.id);
        const canAfford = coins >= item.price;

        let btnHtml, statusClass;
        const tierClass = `tier-${item.tier || 1}`;

        if (equipped) {
            statusClass = 'equipped';
            btnHtml = `<button class="shop-item-btn equipped" onclick="event.stopPropagation();ShopPage.unequip('${item.type}')">Équipé</button>`;
        } else if (owned) {
            statusClass = 'owned';
            btnHtml = `<button class="shop-item-btn owned" onclick="event.stopPropagation();ShopPage.equip('${item.id}','${item.type}')">Équiper</button>`;
        } else if (canAfford) {
            statusClass = '';
            btnHtml = `<button class="shop-item-btn buy" onclick="event.stopPropagation();ShopPage.buy('${item.id}')">${item.price} 🪙</button>`;
        } else {
            statusClass = 'locked';
            btnHtml = `<button class="shop-item-btn locked" disabled>${item.price} 🪙</button>`;
        }

        return `
            <div class="shop-item ${statusClass} ${tierClass}" onclick="ShopPage.preview('${item.id}')" style="cursor:pointer">
                <div class="shop-item-emoji">${this._getIcon(item.id, item.emoji)}</div>
                <div class="shop-item-name">${item.name}</div>
                ${btnHtml}
            </div>
        `;
    },

    // === PREVIEW SYSTEM ===
    preview(itemId) {
        const item = this._findItem(itemId);
        if (!item) return;

        const owned = Storage.isItemOwned(item.id);
        const equipped = Storage.isItemEquipped(item.id);
        const coins = Storage.getCoins();
        const canAfford = coins >= item.price;

        // Build preview items: current equipped + this item
        const currentEquipped = Storage.getEquippedItems().filter(i => i.type !== item.type);
        currentEquipped.push({ id: item.id, type: item.type });

        const previewSVG = Creature.buildSVG(180, { previewItems: currentEquipped });

        let actionBtn;
        if (equipped) {
            actionBtn = `<button class="btn btn-primary" onclick="Modal.close();ShopPage.unequip('${item.type}')" style="flex:1;max-width:160px">Retirer</button>`;
        } else if (owned) {
            actionBtn = `<button class="btn btn-primary" onclick="Modal.close();ShopPage.equip('${item.id}','${item.type}')" style="flex:1;max-width:160px">Équiper</button>`;
        } else if (canAfford) {
            actionBtn = `<button class="btn btn-primary" onclick="Modal.close();ShopPage.buy('${item.id}')" style="flex:1;max-width:160px">Acheter ${item.price} 🪙</button>`;
        } else {
            actionBtn = `<button class="btn btn-secondary" disabled style="flex:1;max-width:160px;opacity:0.5">${item.price} 🪙 (insuffisant)</button>`;
        }

        // Title preview with visual effects
        let titlePreview = '';
        if (item.type === 'title') {
            const titleStyles = {
                title_rookie: 'color:#9E9E9E;font-size:18px;font-weight:700;letter-spacing:1px',
                title_warrior: 'color:#E64A19;text-shadow:0 0 6px rgba(230,74,25,0.4);font-size:18px;font-weight:700;letter-spacing:1px',
                title_champion: 'color:#FFB300;text-shadow:0 0 8px rgba(255,179,0,0.5);font-size:18px;font-weight:700;letter-spacing:1px',
                title_legend: 'color:#FFD700;text-shadow:0 0 10px rgba(255,215,0,0.6),0 0 20px rgba(255,215,0,0.3);font-size:20px;font-weight:800;letter-spacing:2px',
                title_titan: 'color:#B388FF;text-shadow:0 0 10px rgba(179,136,255,0.6),0 0 24px rgba(179,136,255,0.3);font-size:20px;font-weight:800;letter-spacing:2px',
                title_god: 'background:linear-gradient(90deg,#FFD700,#FF8F00,#FFD700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 8px rgba(255,215,0,0.7));font-size:22px;font-weight:900;letter-spacing:3px'
            };
            const style = titleStyles[item.id] || '';
            titlePreview = `<div style="margin:12px 0 4px;text-transform:uppercase;${style}">${item.emoji} ${item.name}</div>`;
        }

        Modal.show(`
            <div style="text-align:center">
                <div class="modal-title" style="display:flex;align-items:center;justify-content:center;gap:8px">Aperçu : <span style="display:inline-flex">${this._getIcon(item.id, item.emoji)}</span> ${item.name}</div>
                <div style="margin:16px 0;display:flex;justify-content:center">
                    ${previewSVG}
                </div>
                ${titlePreview}
                <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
                    <button class="btn btn-secondary" onclick="Modal.close()" style="flex:1;max-width:140px">Fermer</button>
                    ${actionBtn}
                </div>
            </div>
        `);
    },

    buy(itemId) {
        const item = this._findItem(itemId);
        if (!item) return;

        if (!Storage.spendCoins(item.price)) {
            App.showToast('Pas assez de IronCoins !');
            return;
        }

        Storage.addOwnedItem({ id: item.id, type: item.type });
        Storage.equipItem({ id: item.id, type: item.type });

        // Coin flip animation
        this._showCoinFlip(item.price);

        App.showToast(`${item.name} achet\u00e9 et \u00e9quip\u00e9 !`);
        App.showSuccessCheck();
        this._refresh();
    },

    _showCoinFlip(price) {
        const overlay = document.createElement('div');
        overlay.className = 'coin-flip-overlay';
        overlay.innerHTML = `
            <div class="coin-flip-coin">\uD83E\uDE99</div>
            <div class="coin-amount">-${price}</div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1200);
    },

    equip(itemId, itemType) {
        Storage.equipItem({ id: itemId, type: itemType });
        App.showToast('Item équipé !');
        this._refresh();
    },

    unequip(itemType) {
        Storage.unequipItem(itemType);
        App.showToast('Item retiré');
        this._refresh();
    },

    _refresh() {
        if (this._refreshCallback) {
            this._refreshCallback();
        } else {
            this.render();
        }
    },

    _findItem(itemId) {
        for (const cat of this.categories) {
            const found = cat.items.find(i => i.id === itemId);
            if (found) return found;
        }
        return null;
    }
};
