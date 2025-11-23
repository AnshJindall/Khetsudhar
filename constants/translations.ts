// Define the keys to ensure type safety across the app
export type TranslationKeys =
  | 'choose_language'
  | 'choose_your_language_in_hindi'
  | 'choose_crop'
  | 'choose_your_crop_in_hindi'
  | 'confirm'
  | 'monthly_quests'
  | 'leaderboard'
  | 'rewards'
  | 'lessons'
  | 'market_prices'
  | 'current_leaderboard_position'
  | 'available_coins'
  | 'unlocked'
  | 'rewards_tree'
  | 'username'
  | 'password'
  | 'login'
  | 'logging_in'
  | 'signup'
  | 'create_one'
  | 'dont_have_account'
  | 'already_have_account'
  | 'data_note'
  | 'take_quiz'
  | 'take_quiz_to_verify'
  | 'continue_learning'
  | 'profile'
  | 'dashboard'
  | 'rewards_tree_title'
  | 'mission_brief'
  | 'tasks'
  | 'reward_earned'
  | 'quest_completed'
  | 'scan_at_store'
  | 'all_india_prices'
  | 'live_data'
  | 'price_source_tip'
  | 'price_per_unit'
  | 'wealth'
  | 'multiplier'
  | 'quest_coins'
  | 'land_size'
  | 'sustainability_score'
  | 'recent_achievements'
  | 'logout'
  | 'end_session'
  | 'knowledge_check'
  | 'win_xp'
  | 'question'
  | 'submit_answer'
  | 'try_again'
  | 'excellent_work'
  | 'not_quite_right'
  | 'review_lesson'
  | 'claim_reward'
  | 'completed'
  | 'completed_lesson_title'
  // --- NEW KEYS REQUIRED FOR OFFLINE & MARKET FEATURES ---
  | 'offline_mode'
  | 'save'
  | 'saving'
  | 'go_online'
  | 'completed_btn'
  | 'market_pulse'
  | 'live_rates'
  | 'search_placeholder'
  | 'stable'
  | 'syncing'
  | 'no_data'
  | 'no_crops'
  | 'avg_mandi_price';

// Define the structure of the translations
type Translations = Record<TranslationKeys, string>;

// Use the language code (id) stored in your Supabase profile table
interface LanguageMap {
  [key: string]: Translations;
}

const translations: LanguageMap = {
  // English (en) - Default Fallback
  en: {
    choose_language: 'CHOOSE YOUR LANGUAGE',
    choose_your_language_in_hindi: 'Choose your language',
    choose_crop: 'CHOOSE CROP',
    choose_your_crop_in_hindi: 'Choose your crop',
    confirm: 'CONFIRM',
    monthly_quests: 'QUESTS',
    leaderboard: 'LEADERBOARD',
    rewards: 'REWARDS',
    lessons: 'LESSONS',
    market_prices: 'MARKET PRICES',
    current_leaderboard_position: 'CURRENT LEADERBOARD',
    available_coins: 'AVAILABLE COINS',
    unlocked: 'UNLOCKED',
    rewards_tree: 'REWARDS TREE',
    username: 'USERNAME',
    password: 'PASSWORD',
    login: 'LOGIN',
    logging_in: 'LOGGING IN...',
    signup: 'SIGN UP',
    create_one: 'Create one',
    dont_have_account: "Don't have an account?",
    already_have_account: "Already have an account?",
    data_note: "DATA AS PER FARMER REGISTRY 2025",
    take_quiz: 'TAKE QUIZ',
    take_quiz_to_verify: 'TAKE QUIZ TO VERIFY',
    continue_learning: 'CONTINUE LEARNING',
    profile: 'PROFILE',
    dashboard: 'DASHBOARD',
    rewards_tree_title: 'REWARDS TREE',
    mission_brief: 'MISSION BRIEF',
    tasks: 'TASKS',
    reward_earned: 'REWARD EARNED:',
    quest_completed: 'QUEST COMPLETED!',
    scan_at_store: 'Scan at store to claim',
    all_india_prices: 'ALL INDIA SPOT PRICES',
    live_data: 'Live Data',
    price_source_tip: 'Prices fetched from mandi records.',
    price_per_unit: 'Price per',
    wealth: 'WEALTH',
    multiplier: 'MULTIPLIER',
    quest_coins: 'QUEST COINS',
    land_size: 'LAND SIZE',
    sustainability_score: 'SUSTAINABILITY SCORE',
    recent_achievements: 'RECENT ACHIEVEMENTS',
    logout: 'LOGOUT',
    end_session: 'End your session?',
    knowledge_check: 'KNOWLEDGE CHECK',
    win_xp: 'Win {xp} XP',
    question: 'QUESTION',
    submit_answer: 'SUBMIT ANSWER',
    try_again: 'TRY AGAIN',
    excellent_work: 'EXCELLENT WORK!',
    not_quite_right: 'NOT QUITE RIGHT',
    review_lesson: 'Review the lesson to find the right answer.',
    claim_reward: 'CLAIM REWARD',
    completed: 'COMPLETED',
    completed_lesson_title: 'LESSON COMPLETED!',
    
    // --- NEW KEYS ---
    offline_mode: "Offline Mode",
    save: "SAVE",
    saving: "SAVING...",
    go_online: "GO ONLINE TO COMPLETE",
    completed_btn: "COMPLETED ✓",
    market_pulse: "MARKET PULSE",
    live_rates: "Live Mandi Rates",
    search_placeholder: "Search crops...",
    stable: "STABLE",
    syncing: "Syncing...",
    no_data: "No data yet. Pull to refresh!",
    no_crops: "No crops found.",
    avg_mandi_price: "AVG. MANDI PRICE"
  },
  // Hindi (hi)
  hi: {
    choose_language: 'अपनी भाषा चुनें',
    choose_your_language_in_hindi: 'अपनी भाषा चुनें',
    choose_crop: 'फ़सल चुनें',
    choose_your_crop_in_hindi: 'अपनी फसल चुनें',
    confirm: 'पुष्टि करें',
    monthly_quests: 'मासिक मिशन',
    leaderboard: 'लीडरबोर्ड',
    rewards: 'पुरस्कार',
    lessons: 'सीखने के पाठ',
    market_prices: 'बाज़ार मूल्य',
    current_leaderboard_position: 'वर्तमान लीडरबोर्ड',
    available_coins: 'उपलब्ध सिक्के',
    unlocked: 'अनलॉक किए गए',
    rewards_tree: 'पुरस्कार वृक्ष',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    logging_in: 'लॉगिन हो रहा है...',
    signup: 'साइन अप करें',
    create_one: 'एक बनाओ',
    dont_have_account: "खाता नहीं है?",
    already_have_account: "पहले से ही खाता है?",
    data_note: "किसान रजिस्ट्री 2025 के अनुसार डेटा",
    take_quiz: 'क्विज लें',
    take_quiz_to_verify: 'पुष्टि के लिए क्विज लें',
    continue_learning: 'सीखना जारी रखें',
    profile: 'प्रोफाइल',
    dashboard: 'डैशबोर्ड',
    rewards_tree_title: 'पुरस्कार वृक्ष',
    mission_brief: 'मिशन सारांश',
    tasks: 'कार्य',
    reward_earned: 'पुरस्कार प्राप्त:',
    quest_completed: 'मिशन पूरा हुआ!',
    scan_at_store: 'भुगतान के लिए स्टोर पर स्कैन करें',
    all_india_prices: 'अखिल भारतीय मूल्य',
    live_data: 'लाइव डेटा',
    price_source_tip: 'बाजार रिकॉर्ड से प्राप्त मूल्य।',
    price_per_unit: 'प्रति इकाई मूल्य',
    wealth: 'धन',
    multiplier: 'गुणांक',
    quest_coins: 'मिशन सिक्के',
    land_size: 'जमीन का आकार',
    sustainability_score: 'स्थिरता स्कोर',
    recent_achievements: 'हाल की उपलब्धियां',
    logout: 'लॉगआउट',
    end_session: 'अपना सत्र समाप्त करें?',
    knowledge_check: 'ज्ञान जाँच',
    win_xp: '{xp} XP जीतें',
    question: 'प्रश्न',
    submit_answer: 'उत्तर दें',
    try_again: 'पुनः प्रयास करें',
    excellent_work: 'उत्कृष्ट कार्य!',
    not_quite_right: 'पूरी तरह सही नहीं',
    review_lesson: 'सही उत्तर खोजने के लिए पाठ की समीक्षा करें।',
    claim_reward: 'इनाम लें',
    completed: 'पूरा किया',
    completed_lesson_title: 'पाठ पूरा हुआ!',
    
    // --- NEW KEYS ---
    offline_mode: "ऑफ़लाइन मोड",
    save: "सहेजें",
    saving: "सहेजा जा रहा है...",
    go_online: "पूरा करने के लिए ऑनलाइन आएं",
    completed_btn: "पूर्ण ✓",
    market_pulse: "बाज़ार की नब्ज",
    live_rates: "लाइव मंडी दरें",
    search_placeholder: "फसलें खोजें...",
    stable: "स्थिर",
    syncing: "सिंक हो रहा है...",
    no_data: "अभी तक कोई डेटा नहीं। रीफ्रेश करें!",
    no_crops: "कोई फसल नहीं मिली।",
    avg_mandi_price: "औसत मंडी भाव"
  },
  // Punjabi (pa)
  pa: {
    choose_language: 'APNI BHASHA CHUNO',
    choose_your_language_in_hindi: 'Apni Bhasha Chuno',
    choose_crop: 'FASAL CHUNO',
    choose_your_crop_in_hindi: 'Apni Fasal Chuno',
    confirm: 'PAKKA KARO',
    monthly_quests: 'MISSION',
    leaderboard: 'LEADERBOARD',
    rewards: 'INAAM',
    lessons: 'PAATH',
    market_prices: 'BAZAR RATE',
    current_leaderboard_position: 'HAZRI LEADERBOARD',
    available_coins: 'COINS',
    unlocked: 'UNLOCKED',
    rewards_tree: 'INAAM DA RUKH',
    username: 'USERNAME',
    password: 'PASSWORD',
    login: 'LOGIN',
    logging_in: 'LOGIN HO RAHA...',
    signup: 'SIGN UP',
    create_one: 'Create one',
    dont_have_account: "Account nahi hai?",
    already_have_account: "Pehle hi account hai?",
    data_note: "KISAN REGISTRY 2025 DATA",
    take_quiz: 'QUIZ DAO',
    take_quiz_to_verify: 'CHECK LAYI QUIZ DAO',
    continue_learning: 'SIKHNA JARI RAKHO',
    profile: 'PROFILE',
    dashboard: 'DASHBOARD',
    rewards_tree_title: 'INAAM DA RUKH',
    mission_brief: 'MISSION DA SARAANSH',
    tasks: 'KAAM',
    reward_earned: 'INAAM MILEYA:',
    quest_completed: 'MISSION PURA!',
    scan_at_store: 'Store te scan karke claim karo',
    all_india_prices: 'SAARE INDIA DE RATE',
    live_data: 'Live Data',
    price_source_tip: 'Rate mandi records ton aaye ne.',
    price_per_unit: 'Ikai da Rate',
    wealth: 'DAULAT',
    multiplier: 'MULTIPLIER',
    quest_coins: 'MISSION COINS',
    land_size: 'ZAMEEN DA AAKAAR',
    sustainability_score: 'SUSTAINABILITY SCORE',
    recent_achievements: 'HAAL DI ACHIEVEMENT',
    logout: 'LOGOUT',
    end_session: 'Session khatam kariye?',
    knowledge_check: 'GYAN PARKH',
    win_xp: '{xp} XP JITTO',
    question: 'SAWAAL',
    submit_answer: 'UTTAR DAO',
    try_again: 'DOBARA KOSHISH',
    excellent_work: 'BAHUT WAHDIA!',
    not_quite_right: 'SAHI NAHI HAI',
    review_lesson: 'Sahi uttar labhan layi paath vekho.',
    claim_reward: 'INAAM LABHO',
    completed: 'PURA HO GAYA',
    completed_lesson_title: 'PAATH PURA HO GAYA!',
    
    // --- NEW KEYS ---
    offline_mode: "ਔਫਲਾਈਨ ਮੋਡ",
    save: "ਸੰਭਾਲੋ",
    saving: "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    go_online: "ਪੂਰਾ ਕਰਨ ਲਈ ਔਨਲਾਈਨ ਜਾਓ",
    completed_btn: "ਪੂਰਾ ਹੋਇਆ ✓",
    market_pulse: "ਬਜ਼ਾਰ ਦੀ ਨਬਜ਼",
    live_rates: "ਲਾਈਵ ਮੰਡੀ ਦਰਾਂ",
    search_placeholder: "ਫਸਲਾਂ ਖੋਜੋ...",
    stable: "ਸਥਿਰ",
    syncing: "ਸਿੰਕ ਹੋ ਰਿਹਾ ਹੈ...",
    no_data: "ਅਜੇ ਕੋਈ ਡਾਟਾ ਨਹੀਂ। ਰੀਫ੍ਰੈਸ਼ ਕਰੋ!",
    no_crops: "ਕੋਈ ਫਸਲ ਨਹੀਂ ਮਿਲੀ।",
    avg_mandi_price: "ਔਸਤ ਮੰਡੀ ਮੁੱਲ"
  }
};

export const DEFAULT_LANGUAGE = 'en';

export default translations;