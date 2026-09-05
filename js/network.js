// =============================================================================
// WEBCRAFT 2D - NETWORK & MULTIPLAYER MODULE (network.js)
// Firebase Authentication & WebRTC Peer-to-Peer Networking
// =============================================================================

export let STATE = 'MENU';
export let world = null;
export let bgWorld = null;
export let surfaceHeights = [];
export let inventory = new Array(28).fill(null);
export let equippedArmor = [null, null, null, null];
export let entities = [];
export let droppedItems = [];
export let furnaces = [];
export let fluids = new Map();
export let saplingGrowthQueue = new Map();
export let cropGrowthQueue = new Map();
export let nonCollidableTreeWood = new Set();
export let timeOfDay = 0;
export let dayCount = 1;
export let frameCount = 0;
export let currentDifficulty = 'normal';
export let keepInventory = false;
export let currentWorldAchievementsEnabled = true;
export let isMultiplayer = false;
export function setNetworkIsMultiplayer(val) { isMultiplayer = !!val; if (typeof window !== 'undefined') window.isMultiplayer = !!val; }
export function setNetworkEntities(newEntities) { entities = newEntities; if (typeof window !== 'undefined') window.entities = newEntities; }
export let currentMpRoom = null;
export let currentMpWorldName = null;
export let mpCreateDifficulty = 'normal';
export let selectedJoinRoom = null;
export let playerName = '';
export let remotePlayers = {};
export let isSleeping = false;
export let sleepWakeVersion = 0;
export let mpPeerIds = new Set();
export let lastWorldSyncTime = 0;
export let lastWorldStateTimestamp = 0;
export let lastSyncTime = 0;
export let lastSentSkinData = null;
export let lastAutosaveTimestamp = Date.now();
export let pendingPickupRequest = null;
export let caveSkyOpacity = 0;
export let chatSeenMessageIds = new Set();

// Firebase Initialization & Authentication
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'webcraft';
export let firebaseConfig = null;
try {
    firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
        apiKey: "AIzaSyB-e7uzYBdOEQabcBmVwxZKazKPgAnTPrg",
        authDomain: "webcraft-server-c25dd.firebaseapp.com",
        projectId: "webcraft-server-c25dd",
        storageBucket: "webcraft-server-c25dd.firebasestorage.app",
        messagingSenderId: "330910473466",
        appId: "1:330910473466:web:22bbc1c26b4ee8a3847d43",
        measurementId: "G-G2HCYF1ZMH"
    };
} catch (e) {
    console.error("Invalid Firebase configuration", e);
}

export let app = null, db = null, auth = null;
export let fbSignInWithCustomToken = null, fbSignInAnonymously = null;

export async function initFirebaseSdk() {
    if (window.fbAuth) return true;
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
        const authModule = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
        const firestore = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

        fbSignInAnonymously = authModule.signInAnonymously;
        fbSignInWithCustomToken = authModule.signInWithCustomToken;
        window.fbAuthModule = authModule;

        if (firebaseConfig) {
            app = initializeApp(firebaseConfig);
            db = firestore.getFirestore(app);
            auth = authModule.getAuth(app);

            window.fbDb = db;
            window.fbAuth = auth;
            window.fbAppId = appId;
            window.fbModules = firestore;
        }
        return true;
    } catch (e) {
        console.error("Firebase SDK init failed", e);
        return false;
    }
}

export async function saveUserProfileToCloud(profileData) {
    if (!profileData || !profileData.uid || profileData.isGuest) return false;
    try {
        if (!window.fbDb || !window.fbModules) {
            await initFirebaseSdk();
        }
        if (!window.fbDb || !window.fbModules) return false;
        const { doc, setDoc } = window.fbModules;
        const profRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'user_profiles', profileData.uid);
        await setDoc(profRef, profileData, { merge: true });
        return true;
    } catch (e) {
        console.warn("Failed saving profile to Firestore", e);
        return false;
    }
}

export async function getUserProfileFromCloud(uid) {
    if (!uid) return null;
    try {
        if (!window.fbDb || !window.fbModules) {
            await initFirebaseSdk();
        }
        if (!window.fbDb || !window.fbModules) return null;
        const { doc, getDoc } = window.fbModules;
        const profRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'user_profiles', uid);
        const snap = await getDoc(profRef);
        if (snap.exists()) {
            return snap.data();
        }
        return null;
    } catch (e) {
        console.warn("Failed getting profile from Firestore", e);
        return null;
    }
}

// =============================================================================
// WEBCRAFT TAG & SECURITY HELPERS
// =============================================================================

export function normalizeWebcraftTag(tag) {
    if (!tag) return '';
    return tag.toString().trim().replace(/^@+/, '').toLowerCase();
}

export function formatWebcraftTag(tag) {
    const norm = normalizeWebcraftTag(tag);
    return norm ? `@${norm}` : '';
}

export function validateWebcraftTag(tag) {
    const norm = normalizeWebcraftTag(tag);
    if (!norm || norm.length < 3 || norm.length > 20) {
        return { valid: false, error: "Webcraft tag must be between 3 and 20 characters." };
    }
    if (!/^[a-z0-9_]+$/.test(norm)) {
        return { valid: false, error: "Webcraft tag can only contain letters, numbers, and underscores." };
    }
    return { valid: true, normalizedTag: norm, formattedTag: `@${norm}` };
}

export async function hashPassword(password) {
    const clean = (password || '').toString();
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(clean + "_webcraft_salt_v1");
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn("crypto.subtle hash failed, using fallback", e);
        }
    }
    // Cross-environment deterministic hash fallback
    let hash = 0;
    const salted = clean + "_webcraft_salt_v1";
    for (let i = 0; i < salted.length; i++) {
        const char = salted.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return "h_" + Math.abs(hash).toString(16);
}

// Pure JS SHA-256 implementation fallback (RFC 6234 compliant)
export function pureJsSha256(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = "length";
    let i, j;
    let result = "";
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    hash = hash.slice(0, 8);
    ascii += "\x80";
    while (ascii[lengthProperty] % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
        const w = words.slice(j, j += 16);
        const oldHash = hash;
        hash = hash.slice(0, 8);
        for (i = 0; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            const a = hash[0], e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                ) | 0);
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
    }
    for (i = 0; i < 8; i++) {
        for (let i2 = 3; i2 >= 0; i2--) {
            const b = (hash[i] >> (i2 * 8)) & 255;
            result += ((b < 16) ? "0" : "") + b.toString(16);
        }
    }
    return result;
}

export async function hashStringSHA256(str) {
    const text = (str || '').toString();
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn("crypto.subtle hash failed, falling back to pure JS SHA-256", e);
        }
    }
    return pureJsSha256(text);
}

// Closed Beta configuration constants (passkey SHA-256 hashed; plaintext is never stored in code)
export const DEFAULT_BETA_PASSWORD_HASH = "b1c1e8d1fbb9e5c6cb40e3e4fb783627fdf0fb165286e63571dbc7784f6bb585";
export const CLOSED_BETA_LOCALSTORAGE_KEY = 'webcraft_closed_beta_unlocked';

export async function fetchClosedBetaConfig() {
    const defaultConfig = {
        locked: true,
        passwordHash: DEFAULT_BETA_PASSWORD_HASH,
        description: "Closed beta lock toggle: set locked to false to open game without password"
    };

    try {
        if (typeof window === 'undefined') return defaultConfig;
        if (!window.fbDb || !window.fbModules) {
            await initFirebaseSdk();
        }
        if (!window.fbDb || !window.fbModules) {
            return defaultConfig;
        }
        const { doc, getDoc, setDoc } = window.fbModules;
        const artifactConfigRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'system_config', 'closed_beta');
        
        let rootConfigRef = null;
        try {
            rootConfigRef = doc(window.fbDb, 'system_config', 'closed_beta');
        } catch (e) {}

        let snap = null;
        try {
            snap = await getDoc(artifactConfigRef);
        } catch (e) {
            console.warn("Could not read artifact system_config path:", e);
        }

        if (!snap || !snap.exists()) {
            if (rootConfigRef) {
                try {
                    const rootSnap = await getDoc(rootConfigRef);
                    if (rootSnap && rootSnap.exists()) {
                        snap = rootSnap;
                    }
                } catch (e) {
                    console.warn("Could not read root system_config path:", e);
                }
            }
        }

        if (snap && snap.exists()) {
            const data = snap.data();
            return {
                locked: typeof data.locked === 'boolean' ? data.locked : true,
                passwordHash: data.passwordHash || DEFAULT_BETA_PASSWORD_HASH,
                description: data.description || defaultConfig.description
            };
        }

        // Auto-seed document in Firestore so it's immediately accessible in Firebase Console
        try {
            const seedPayload = {
                ...defaultConfig,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await setDoc(artifactConfigRef, seedPayload, { merge: true });
            if (rootConfigRef) {
                try { await setDoc(rootConfigRef, seedPayload, { merge: true }); } catch (e) {}
            }
        } catch (seedErr) {
            console.warn("Auto-seeding closed_beta config in Firebase failed:", seedErr);
        }

        return defaultConfig;
    } catch (err) {
        console.warn("fetchClosedBetaConfig encountered error, falling back to default:", err);
        return defaultConfig;
    }
}

export async function setClosedBetaLockState(isLocked) {
    try {
        if (typeof window === 'undefined') return false;
        if (!window.fbDb || !window.fbModules) {
            await initFirebaseSdk();
        }
        if (!window.fbDb || !window.fbModules) {
            throw new Error("Firebase SDK is not available.");
        }
        const { doc, setDoc } = window.fbModules;
        const artifactConfigRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'system_config', 'closed_beta');
        const updateData = {
            locked: !!isLocked,
            passwordHash: DEFAULT_BETA_PASSWORD_HASH,
            description: "Closed beta lock toggle: set locked to false to open game without password",
            updatedAt: Date.now()
        };
        await setDoc(artifactConfigRef, updateData, { merge: true });
        try {
            const rootRef = doc(window.fbDb, 'system_config', 'closed_beta');
            await setDoc(rootRef, updateData, { merge: true });
        } catch (e) {}
        console.log(`[Closed Beta] Lock state updated in Firebase to: ${!!isLocked}`);
        return true;
    } catch (err) {
        console.error("[Closed Beta] Failed to set lock state in Firebase:", err);
        throw err;
    }
}

// =============================================================================
// UNIVERSAL CLOUD ACCOUNT PERSISTENCE & AUTHENTICATION
// =============================================================================

export async function registerWebcraftAccount(username, tagOrEmail, emailOrPassword, passwordOrSkinData = null, initialSkinData = null) {
    await initFirebaseSdk();
    if (window.initFirebase) {
        try { await window.initFirebase(); } catch(e) {}
    }

    // Flexible argument normalization (supports (username, tag, email, password, skin) or legacy (username, email, password, skin))
    let cleanUsername = (username || '').trim();
    let rawTag = '';
    let cleanEmail = '';
    let password = '';
    let skinData = initialSkinData;

    if (passwordOrSkinData && typeof passwordOrSkinData === 'string') {
        // Called with: (username, tag, email, password, skinData)
        rawTag = tagOrEmail;
        cleanEmail = (emailOrPassword || '').trim().toLowerCase();
        password = passwordOrSkinData;
        skinData = initialSkinData;
    } else {
        // Called with: (username, tag, password, skinData) or (username, email, password, skinData)
        if (typeof tagOrEmail === 'string' && tagOrEmail.includes('@') && tagOrEmail.includes('.')) {
            // Legacy signature: tagOrEmail is email
            cleanEmail = tagOrEmail.trim().toLowerCase();
            rawTag = cleanUsername; // derive tag from username
            password = emailOrPassword;
            skinData = passwordOrSkinData;
        } else {
            rawTag = tagOrEmail;
            cleanEmail = '';
            password = emailOrPassword;
            skinData = passwordOrSkinData;
        }
    }

    if (!cleanUsername || cleanUsername.length < 2) {
        throw new Error("Character name must be at least 2 characters.");
    }

    // Obligatory Webcraft Tag Validation
    const tagValidation = validateWebcraftTag(rawTag);
    if (!tagValidation.valid) {
        throw new Error(tagValidation.error);
    }
    const normalizedTag = tagValidation.normalizedTag;
    const formattedTag = tagValidation.formattedTag;

    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }

    // Check Tag uniqueness in Cloud Firestore
    if (window.fbDb && window.fbModules) {
        try {
            const { doc, getDoc } = window.fbModules;
            const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', normalizedTag);
            const tagSnap = await getDoc(tagDocRef);
            if (tagSnap && tagSnap.exists()) {
                throw new Error(`The Webcraft tag ${formattedTag} is already taken. Please choose another.`);
            }
        } catch (err) {
            if (err.message && err.message.includes('already taken')) throw err;
            console.warn("Firestore uniqueness check warning:", err);
        }

        // Check Email uniqueness if email provided
        if (cleanEmail) {
            try {
                const { doc, getDoc } = window.fbModules;
                const emailDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_account_emails', encodeURIComponent(cleanEmail));
                const emailSnap = await getDoc(emailDocRef);
                if (emailSnap && emailSnap.exists()) {
                    throw new Error(`An account with email ${cleanEmail} already exists. Please log in instead.`);
                }
            } catch (err) {
                if (err.message && err.message.includes('already exists')) throw err;
            }
        }
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(password);

    const accountRecord = {
        uid: uid,
        username: cleanUsername,
        tag: formattedTag,
        normalizedTag: normalizedTag,
        email: cleanEmail,
        passwordHash: passwordHash,
        isGuest: false,
        activeSkinId: 'custom',
        skinData: skinData || null,
        emeralds: parseInt(localStorage.getItem('swc_emeralds_count') || '0', 10),
        friends: [],
        friendRequests: [],
        isOnline: true,
        lastActive: Date.now(),
        createdAt: Date.now(),
        lastLogin: Date.now()
    };

    // Save to Cloud Firestore (Universal cross-instance accounts database)
    if (window.fbDb && window.fbModules) {
        try {
            const { doc, setDoc } = window.fbModules;
            const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', normalizedTag);
            await setDoc(tagDocRef, accountRecord);

            if (cleanEmail) {
                const emailDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_account_emails', encodeURIComponent(cleanEmail));
                await setDoc(emailDocRef, { tag: normalizedTag, uid: uid });
            }

            await saveUserProfileToCloud(accountRecord);
        } catch (e) {
            console.warn("Cloud Firestore account persistence warning:", e);
        }
    }

    // Cache locally in localStorage for fast offline/instant login
    try {
        const accountsRaw = localStorage.getItem('swc_registered_accounts_v1') || '{}';
        const accounts = JSON.parse(accountsRaw);
        accounts[normalizedTag] = accountRecord;
        accounts[formattedTag] = accountRecord;
        if (cleanEmail) accounts[cleanEmail] = accountRecord;
        accounts[cleanUsername.toLowerCase()] = accountRecord;
        localStorage.setItem('swc_registered_accounts_v1', JSON.stringify(accounts));
    } catch (e) {
        console.warn("Local storage cache warning", e);
    }

    localStorage.setItem('webcraft_user_profile', JSON.stringify(accountRecord));
    localStorage.setItem('swc_player_name', cleanUsername);
    playerName = cleanUsername;

    startPresenceHeartbeat(normalizedTag);

    return accountRecord;
}

export async function loginWebcraftAccount(emailOrTagOrUsername, password) {
    await initFirebaseSdk();
    if (window.initFirebase) {
        try { await window.initFirebase(); } catch(e) {}
    }

    const rawInput = (emailOrTagOrUsername || '').trim();
    const cleanInput = rawInput.toLowerCase();
    const candidateTag = normalizeWebcraftTag(rawInput);
    let accountRecord = null;

    // 1. Check Cloud Firestore by Webcraft Tag
    if (candidateTag && window.fbDb && window.fbModules) {
        try {
            const { doc, getDoc } = window.fbModules;
            const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', candidateTag);
            const snap = await getDoc(tagDocRef);
            if (snap && snap.exists()) {
                accountRecord = snap.data();
            }
        } catch (e) {
            console.warn("Firestore tag lookup error:", e);
        }
    }

    // 2. Check Cloud Firestore by Email index
    if (!accountRecord && cleanInput.includes('@') && cleanInput.includes('.') && window.fbDb && window.fbModules) {
        try {
            const { doc, getDoc } = window.fbModules;
            const emailDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_account_emails', encodeURIComponent(cleanInput));
            const emailSnap = await getDoc(emailDocRef);
            if (emailSnap && emailSnap.exists()) {
                const emailData = emailSnap.data();
                if (emailData && emailData.tag) {
                    const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', emailData.tag);
                    const snap = await getDoc(tagDocRef);
                    if (snap && snap.exists()) {
                        accountRecord = snap.data();
                    }
                }
            }
        } catch (e) {
            console.warn("Firestore email index lookup error:", e);
        }
    }

    // 3. Check Cloud Firestore by scanning/querying webcraft_accounts
    if (!accountRecord && window.fbDb && window.fbModules) {
        try {
            const { collection, getDocs } = window.fbModules;
            const accountsCol = collection(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts');
            const snap = await getDocs(accountsCol);
            snap.forEach(d => {
                const data = d.data();
                if (!accountRecord && data) {
                    if ((data.normalizedTag && data.normalizedTag === candidateTag) ||
                        (data.email && data.email.toLowerCase() === cleanInput) ||
                        (data.username && data.username.toLowerCase() === cleanInput)) {
                        accountRecord = data;
                    }
                }
            });
        } catch (e) {
            console.warn("Firestore accounts collection scan error:", e);
        }
    }

    // 4. Fallback to local cache in localStorage (for offline play)
    if (!accountRecord) {
        try {
            const accountsRaw = localStorage.getItem('swc_registered_accounts_v1') || '{}';
            const accounts = JSON.parse(accountsRaw);
            accountRecord = accounts[candidateTag] || accounts[cleanInput] || Object.values(accounts).find(a =>
                (a.normalizedTag && a.normalizedTag === candidateTag) ||
                (a.email && a.email.toLowerCase() === cleanInput) ||
                (a.username && a.username.toLowerCase() === cleanInput)
            );
        } catch (e) {}
    }

    // 5. Check existing local profile if still not found
    if (!accountRecord) {
        const storedRaw = localStorage.getItem('webcraft_user_profile');
        if (storedRaw) {
            try {
                const p = JSON.parse(storedRaw);
                if (p && !p.isGuest && (
                    (p.normalizedTag && p.normalizedTag === candidateTag) ||
                    (p.email && p.email.toLowerCase() === cleanInput) ||
                    (p.username && p.username.toLowerCase() === cleanInput)
                )) {
                    accountRecord = p;
                }
            } catch(e) {}
        }
    }

    if (!accountRecord) {
        throw new Error(`No account found for '${rawInput}'. Please check your spelling or sign up.`);
    }

    // Verify Password Hash
    const passHash = await hashPassword(password);
    const isPasswordValid = (accountRecord.passwordHash && accountRecord.passwordHash === passHash) ||
                            (accountRecord.password && accountRecord.password === password) ||
                            (accountRecord.password && accountRecord.password === password.trim());

    if (!isPasswordValid) {
        throw new Error("auth/wrong-password");
    }

    // Upgrade legacy plaintext password to secure hash
    if (!accountRecord.passwordHash) {
        accountRecord.passwordHash = passHash;
        delete accountRecord.password;
    }

    // Ensure @tag is properly formatted
    if (!accountRecord.tag && accountRecord.normalizedTag) {
        accountRecord.tag = `@${accountRecord.normalizedTag}`;
    } else if (!accountRecord.tag && accountRecord.username) {
        accountRecord.normalizedTag = normalizeWebcraftTag(accountRecord.username);
        accountRecord.tag = `@${accountRecord.normalizedTag}`;
    }

    if (!Array.isArray(accountRecord.friends)) {
        accountRecord.friends = [];
    }
    if (!Array.isArray(accountRecord.friendRequests)) {
        accountRecord.friendRequests = [];
    }

    accountRecord.isOnline = true;
    accountRecord.lastActive = Date.now();
    accountRecord.lastLogin = Date.now();

    // Update in Firestore
    if (window.fbDb && window.fbModules && accountRecord.normalizedTag) {
        try {
            const { doc, updateDoc } = window.fbModules;
            const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', accountRecord.normalizedTag);
            await updateDoc(tagDocRef, {
                isOnline: true,
                lastActive: accountRecord.lastActive,
                lastLogin: accountRecord.lastLogin,
                passwordHash: accountRecord.passwordHash,
                friends: accountRecord.friends,
                friendRequests: accountRecord.friendRequests
            });
        } catch(e) {
            console.warn("Could not update lastLogin in Firestore", e);
        }
    }

    // Save session
    localStorage.setItem('webcraft_user_profile', JSON.stringify(accountRecord));
    localStorage.setItem('swc_player_name', accountRecord.username);
    playerName = accountRecord.username;

    startPresenceHeartbeat(accountRecord.normalizedTag);

    // Cache in local accounts
    try {
        const accountsRaw = localStorage.getItem('swc_registered_accounts_v1') || '{}';
        const accounts = JSON.parse(accountsRaw);
        accounts[accountRecord.normalizedTag] = accountRecord;
        accounts[accountRecord.tag] = accountRecord;
        if (accountRecord.email) accounts[accountRecord.email] = accountRecord;
        localStorage.setItem('swc_registered_accounts_v1', JSON.stringify(accounts));
    } catch (e) {}

    return accountRecord;
}

export async function loginAsGuest(guestName = null) {
    await initFirebaseSdk();
    const finalName = guestName && guestName.trim() ? guestName.trim() : ('Guest_' + Math.floor(1000 + Math.random() * 9000));
    let uid = 'guest_' + Date.now();

    try {
        if (window.fbAuth && window.fbAuthModule?.signInAnonymously) {
            const cred = await window.fbAuthModule.signInAnonymously(window.fbAuth);
            if (cred && cred.user) {
                uid = cred.user.uid;
                window.user = cred.user;
            }
        }
    } catch (e) {
        console.warn("Guest anonymous auth fallback to local session", e);
    }

    // Guests do NOT have a Webcraft tag (tag: null)
    const guestProfile = {
        uid: uid,
        username: finalName,
        tag: null,
        email: null,
        isGuest: true,
        activeSkinId: 'steve',
        skinData: null,
        emeralds: parseInt(localStorage.getItem('swc_emeralds_count') || '0', 10),
        friends: [],
        createdAt: Date.now(),
        lastLogin: Date.now()
    };

    localStorage.setItem('webcraft_user_profile', JSON.stringify(guestProfile));
    localStorage.setItem('swc_player_name', finalName);
    playerName = finalName;

    return guestProfile;
}

// =============================================================================
// FRIENDS SYSTEM API
// =============================================================================

export async function sendFriendRequestByTag(targetTag) {
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;

    // GUEST RESTRICTION: Guests cannot add accounts as friends!
    if (!myProfile || myProfile.isGuest) {
        throw new Error("Guests cannot add accounts as friends. Please log in or create a Webcraft account to add friends.");
    }

    const validation = validateWebcraftTag(targetTag);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    const friendNormTag = validation.normalizedTag;
    const myNormTag = normalizeWebcraftTag(myProfile.tag || myProfile.normalizedTag || myProfile.username);

    if (friendNormTag === myNormTag) {
        throw new Error("You cannot add yourself as a friend!");
    }

    if (Array.isArray(myProfile.friends) && myProfile.friends.includes(friendNormTag)) {
        throw new Error(`@${friendNormTag} is already in your friends list!`);
    }

    await initFirebaseSdk();
    if (!window.fbDb || !window.fbModules) {
        throw new Error("Firebase connection unavailable. Please check your internet connection.");
    }

    const { doc, getDoc, updateDoc } = window.fbModules;
    const friendDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', friendNormTag);
    const friendSnap = await getDoc(friendDocRef);

    if (!friendSnap || !friendSnap.exists()) {
        throw new Error(`No Webcraft account found with tag @${friendNormTag}. Make sure they have registered an account.`);
    }

    const friendData = friendSnap.data();

    // 1. Reciprocal Auto-Accept: Check if target has ALREADY sent an incoming request to current user
    let myIncomingRequests = Array.isArray(myProfile.friendRequests) ? [...myProfile.friendRequests] : [];
    try {
        const myDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', myNormTag);
        const mySnap = await getDoc(myDocRef);
        if (mySnap && mySnap.exists()) {
            const myData = mySnap.data();
            if (Array.isArray(myData.friendRequests)) {
                myIncomingRequests = myData.friendRequests;
                myProfile.friendRequests = myIncomingRequests;
                localStorage.setItem('webcraft_user_profile', JSON.stringify(myProfile));
            }
        }
    } catch (e) {}

    const hasIncomingFromTarget = myIncomingRequests.some(req => {
        const reqTag = typeof req === 'string' ? normalizeWebcraftTag(req) : normalizeWebcraftTag(req?.fromTag || req?.tag);
        return reqTag === friendNormTag;
    });

    if (hasIncomingFromTarget) {
        return await acceptFriendRequestByTag(friendNormTag);
    }

    // 2. Check if a friend request was already sent to target user
    const targetRequests = Array.isArray(friendData.friendRequests) ? [...friendData.friendRequests] : [];
    const alreadySent = targetRequests.some(req => {
        const reqTag = typeof req === 'string' ? normalizeWebcraftTag(req) : normalizeWebcraftTag(req?.fromTag || req?.tag);
        return reqTag === myNormTag;
    });

    if (alreadySent) {
        return {
            status: 'pending',
            tag: friendData.tag || `@${friendNormTag}`,
            username: friendData.username || friendNormTag,
            message: `Friend request already sent to @${friendNormTag}. Waiting for them to accept!`
        };
    }

    // 3. Add to target user's incoming friendRequests list in Firestore
    targetRequests.push({
        fromTag: myNormTag,
        fromUsername: myProfile.username || myNormTag,
        timestamp: Date.now()
    });

    try {
        await updateDoc(friendDocRef, { friendRequests: targetRequests });
    } catch (e) {
        console.warn("Failed updating friendRequests in Firestore", e);
        throw new Error("Could not send friend request. Check connection.");
    }

    return {
        status: 'sent',
        tag: friendData.tag || `@${friendNormTag}`,
        username: friendData.username || friendNormTag,
        message: `Friend request sent to @${friendNormTag}!`
    };
}

export async function addFriendByTag(targetTag) {
    return await sendFriendRequestByTag(targetTag);
}

export async function fetchIncomingFriendRequests() {
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
    if (!myProfile || myProfile.isGuest) return [];

    const myNormTag = normalizeWebcraftTag(myProfile.tag || myProfile.normalizedTag || myProfile.username);
    if (!myNormTag) return [];

    await initFirebaseSdk();
    let rawRequests = [];
    if (window.fbDb && window.fbModules) {
        try {
            const { doc, getDoc } = window.fbModules;
            const myDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', myNormTag);
            const mySnap = await getDoc(myDocRef);
            if (mySnap && mySnap.exists()) {
                const data = mySnap.data();
                rawRequests = Array.isArray(data.friendRequests) ? data.friendRequests : [];
                myProfile.friendRequests = rawRequests;
                localStorage.setItem('webcraft_user_profile', JSON.stringify(myProfile));
            }
        } catch (e) {
            console.warn("Error fetching incoming friend requests", e);
            rawRequests = Array.isArray(myProfile.friendRequests) ? myProfile.friendRequests : [];
        }
    } else {
        rawRequests = Array.isArray(myProfile.friendRequests) ? myProfile.friendRequests : [];
    }

    const enriched = [];
    for (const req of rawRequests) {
        const fromTag = typeof req === 'string' ? normalizeWebcraftTag(req) : normalizeWebcraftTag(req?.fromTag || req?.tag);
        if (!fromTag) continue;

        let requesterData = null;
        if (window.fbDb && window.fbModules) {
            try {
                const { doc, getDoc } = window.fbModules;
                const reqRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', fromTag);
                const reqSnap = await getDoc(reqRef);
                if (reqSnap && reqSnap.exists()) {
                    requesterData = reqSnap.data();
                }
            } catch(e) {}
        }

        enriched.push({
            tag: requesterData?.tag || `@${fromTag}`,
            normalizedTag: fromTag,
            username: requesterData?.username || (typeof req === 'object' && req.fromUsername ? req.fromUsername : fromTag),
            skinData: requesterData?.skinData || null,
            timestamp: typeof req === 'object' && req.timestamp ? req.timestamp : Date.now()
        });
    }

    return enriched;
}

export async function acceptFriendRequestByTag(targetTag) {
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
    if (!myProfile || myProfile.isGuest) {
        throw new Error("Please log in to accept friend requests.");
    }

    const reqNormTag = normalizeWebcraftTag(targetTag);
    const myNormTag = normalizeWebcraftTag(myProfile.tag || myProfile.normalizedTag || myProfile.username);

    // 1. Update local profile: add to friends, remove from friendRequests
    if (!Array.isArray(myProfile.friends)) myProfile.friends = [];
    if (!myProfile.friends.includes(reqNormTag)) {
        myProfile.friends.push(reqNormTag);
    }
    if (Array.isArray(myProfile.friendRequests)) {
        myProfile.friendRequests = myProfile.friendRequests.filter(r => {
            const t = typeof r === 'string' ? normalizeWebcraftTag(r) : normalizeWebcraftTag(r?.fromTag || r?.tag);
            return t !== reqNormTag;
        });
    }
    localStorage.setItem('webcraft_user_profile', JSON.stringify(myProfile));

    await initFirebaseSdk();
    if (window.fbDb && window.fbModules) {
        const { doc, updateDoc, getDoc } = window.fbModules;
        // Update current user doc in Firestore
        try {
            const myDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', myNormTag);
            await updateDoc(myDocRef, {
                friends: myProfile.friends,
                friendRequests: myProfile.friendRequests || []
            });
        } catch (e) {
            console.warn("Failed updating user friends upon accept", e);
        }

        // Update requester doc in Firestore: add current user to their friends, remove from their friendRequests
        try {
            const reqDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', reqNormTag);
            const reqSnap = await getDoc(reqDocRef);
            if (reqSnap && reqSnap.exists()) {
                const reqData = reqSnap.data();
                const reqFriends = Array.isArray(reqData.friends) ? [...reqData.friends] : [];
                if (!reqFriends.includes(myNormTag)) {
                    reqFriends.push(myNormTag);
                }
                const reqIncoming = Array.isArray(reqData.friendRequests)
                    ? reqData.friendRequests.filter(r => {
                        const t = typeof r === 'string' ? normalizeWebcraftTag(r) : normalizeWebcraftTag(r?.fromTag || r?.tag);
                        return t !== myNormTag;
                    })
                    : [];
                await updateDoc(reqDocRef, {
                    friends: reqFriends,
                    friendRequests: reqIncoming
                });
            }
        } catch (e) {
            console.warn("Failed updating mutual friend upon accept", e);
        }
    }

    return {
        status: 'accepted',
        tag: `@${reqNormTag}`,
        normalizedTag: reqNormTag,
        message: `Accepted friend request from @${reqNormTag}!`
    };
}

export async function declineFriendRequestByTag(targetTag) {
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
    if (!myProfile || myProfile.isGuest) return false;

    const reqNormTag = normalizeWebcraftTag(targetTag);
    const myNormTag = normalizeWebcraftTag(myProfile.tag || myProfile.normalizedTag || myProfile.username);

    if (Array.isArray(myProfile.friendRequests)) {
        myProfile.friendRequests = myProfile.friendRequests.filter(r => {
            const t = typeof r === 'string' ? normalizeWebcraftTag(r) : normalizeWebcraftTag(r?.fromTag || r?.tag);
            return t !== reqNormTag;
        });
        localStorage.setItem('webcraft_user_profile', JSON.stringify(myProfile));
    }

    await initFirebaseSdk();
    if (window.fbDb && window.fbModules) {
        try {
            const { doc, updateDoc } = window.fbModules;
            const myDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', myNormTag);
            await updateDoc(myDocRef, {
                friendRequests: myProfile.friendRequests || []
            });
        } catch (e) {
            console.warn("Failed updating friendRequests upon decline", e);
        }
    }

    return true;
}

export async function removeFriendByTag(targetTag) {
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
    if (!myProfile || myProfile.isGuest) return false;

    const friendNormTag = normalizeWebcraftTag(targetTag);
    const myNormTag = normalizeWebcraftTag(myProfile.tag || myProfile.normalizedTag || myProfile.username);

    if (Array.isArray(myProfile.friends)) {
        myProfile.friends = myProfile.friends.filter(t => t !== friendNormTag);
        localStorage.setItem('webcraft_user_profile', JSON.stringify(myProfile));
    }

    await initFirebaseSdk();
    if (window.fbDb && window.fbModules) {
        const { doc, updateDoc, getDoc } = window.fbModules;
        try {
            const myDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', myNormTag);
            await updateDoc(myDocRef, { friends: myProfile.friends });
        } catch(e) {}

        // Remove from target friend's list as well
        try {
            const friendDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', friendNormTag);
            const friendSnap = await getDoc(friendDocRef);
            if (friendSnap && friendSnap.exists()) {
                const fData = friendSnap.data();
                if (Array.isArray(fData.friends)) {
                    const updated = fData.friends.filter(t => t !== myNormTag);
                    await updateDoc(friendDocRef, { friends: updated });
                }
            }
        } catch(e) {}
    }

    return true;
}

export async function fetchFriendsProfiles(friendTags = []) {
    if (!Array.isArray(friendTags) || friendTags.length === 0) return [];
    await initFirebaseSdk();
    const results = [];
    const now = Date.now();

    for (const tag of friendTags) {
        const normTag = normalizeWebcraftTag(tag);
        let profile = null;
        if (window.fbDb && window.fbModules) {
            try {
                const { doc, getDoc } = window.fbModules;
                const ref = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', normTag);
                const snap = await getDoc(ref);
                if (snap && snap.exists()) {
                    profile = snap.data();
                }
            } catch(e) {}
        }

        if (profile) {
            const lastActiveTime = profile.lastActive || profile.lastLogin || 0;
            // Online if explicitly marked isOnline === true AND heartbeat was within the last 60 seconds
            const isOnline = (profile.isOnline === true) && (now - lastActiveTime < 60 * 1000);
            results.push({
                tag: profile.tag || `@${normTag}`,
                normalizedTag: normTag,
                username: profile.username || normTag,
                skinData: profile.skinData || null,
                lastLogin: profile.lastLogin || 0,
                lastActive: lastActiveTime,
                isOnline: isOnline
            });
        } else {
            results.push({
                tag: `@${normTag}`,
                normalizedTag: normTag,
                username: normTag,
                skinData: null,
                lastLogin: 0,
                lastActive: 0,
                isOnline: false
            });
        }
    }
    return results;
}

// =============================================================================
// PRESENCE HEARTBEAT & TEARDOWN SYSTEM
// =============================================================================
let presenceTimer = null;
let isPresenceTrackingActive = false;

export function startPresenceHeartbeat(rawTag = null) {
    if (!rawTag) {
        const rawProfile = localStorage.getItem('webcraft_user_profile');
        const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
        if (!myProfile || myProfile.isGuest) return;
        rawTag = myProfile.normalizedTag || myProfile.tag || myProfile.username;
    }
    const normTag = normalizeWebcraftTag(rawTag);
    if (!normTag) return;

    if (presenceTimer) {
        clearInterval(presenceTimer);
        presenceTimer = null;
    }

    const updateOnline = async (online) => {
        if (!window.fbDb || !window.fbModules) return;
        try {
            const { doc, updateDoc } = window.fbModules;
            const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', normTag);
            await updateDoc(tagDocRef, {
                isOnline: !!online,
                lastActive: Date.now()
            });
        } catch (e) {}
    };

    // Set online immediately
    initFirebaseSdk().then(() => updateOnline(true)).catch(() => {});

    // Periodic heartbeat every 30 seconds
    presenceTimer = setInterval(() => {
        const rawProfile = localStorage.getItem('webcraft_user_profile');
        const profile = rawProfile ? JSON.parse(rawProfile) : null;
        if (!profile || profile.isGuest) {
            stopPresenceHeartbeat();
            return;
        }
        updateOnline(true);
    }, 30000);

    if (!isPresenceTrackingActive && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        isPresenceTrackingActive = true;
        const setOfflineImmediate = () => {
            const rawProfile = localStorage.getItem('webcraft_user_profile');
            const profile = rawProfile ? JSON.parse(rawProfile) : null;
            if (!profile || profile.isGuest) return;
            const tag = normalizeWebcraftTag(profile.normalizedTag || profile.tag || profile.username);
            if (!tag || !window.fbDb || !window.fbModules) return;
            try {
                const { doc, updateDoc } = window.fbModules;
                const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', tag);
                updateDoc(tagDocRef, {
                    isOnline: false,
                    lastActive: Date.now()
                }).catch(() => {});
            } catch (e) {}
        };

        window.addEventListener('beforeunload', setOfflineImmediate);
        window.addEventListener('pagehide', setOfflineImmediate);
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    updateOnline(true);
                }
            });
        }
    }
}

export function stopPresenceHeartbeat() {
    if (presenceTimer) {
        clearInterval(presenceTimer);
        presenceTimer = null;
    }
    const rawProfile = localStorage.getItem('webcraft_user_profile');
    const myProfile = rawProfile ? JSON.parse(rawProfile) : null;
    if (myProfile && !myProfile.isGuest && window.fbDb && window.fbModules) {
        const normTag = normalizeWebcraftTag(myProfile.normalizedTag || myProfile.tag || myProfile.username);
        if (normTag) {
            try {
                const { doc, updateDoc } = window.fbModules;
                const tagDocRef = doc(window.fbDb, 'artifacts', window.fbAppId || 'webcraft', 'public', 'data', 'webcraft_accounts', normTag);
                updateDoc(tagDocRef, { isOnline: false, lastActive: Date.now() }).catch(() => {});
            } catch(e) {}
        }
    }
}

export async function logoutWebcraftAccount() {
    stopPresenceHeartbeat();
    try {
        if (window.fbAuth && window.fbAuthModule?.signOut) {
            await window.fbAuthModule.signOut(window.fbAuth);
        }
    } catch (e) {
        console.warn("Sign out error", e);
    }
    localStorage.removeItem('webcraft_user_profile');
    window.user = null;
}

if (typeof window !== 'undefined') {
    window.initFirebase = async () => {
        if (!window.fbAuth) {
            await initFirebaseSdk();
        }
        if (!window.fbAuth) return false;
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token && fbSignInWithCustomToken) {
                await fbSignInWithCustomToken(window.fbAuth, __initial_auth_token);
            } else if (window.fbAuth.currentUser) {
                window.user = window.fbAuth.currentUser;
            } else if (fbSignInAnonymously) {
                await fbSignInAnonymously(window.fbAuth);
            }
            window.user = window.fbAuth.currentUser;
            return true;
        } catch (e) {
            console.error("Auth failed", e);
            return false;
        }
    };

    // Auto-authenticate immediately
    initFirebaseSdk().then(() => {
        if (window.initFirebase) window.initFirebase();
    });
}

    export let mpUnsubscribers = [];
    export let lastMultiplayerConnection = null;
    export let pendingDropRequest = null;
    export let multiplayerConnectionAttempt = 0;

    // WebRTC Peer-to-Peer Configuration & State
    export const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };
    export let peerConnection = null;
    export let gameDataChannel = null;
    export let isWebRTCHost = false;


    export function tryCompleteMultiplayerSleep() {
        if (!isSleeping || timeOfDay <= 0.5 || timeOfDay > 0.9) return;
        if (sleepStartTime && performance.now() - sleepStartTime >= sleepTransitionMs) {
            completeSleepTransition();
        }
    }

    export function syncBlock(x, y, newId, extraData = {}) {
        if (!isMultiplayer) return;
        if (!Number.isInteger(x) || !Number.isInteger(y)) return;
        const payload = {
            type: 'block',
            id: Number(newId),
            x: Number(x),
            y: Number(y),
            newId: Number(newId),
            timestamp: Date.now()
        };
        if (extraData.growthAt !== undefined) payload.growthAt = extraData.growthAt;
        if (extraData.treeTrunk) payload.treeTrunk = true;
        if (extraData.isBackground) payload.isBackground = true;

        broadcastDataPacket(payload);
    }

    export let lastFluidSyncTime = 0;
    export function syncFluidState() {
        if (!isMultiplayer || !isMultiplayerAuthority()) return;
        const now = Date.now();
        if (now - lastFluidSyncTime < 250) return; // Throttle fluid broadcast to max 4 times/sec
        lastFluidSyncTime = now;
        broadcastDataPacket({
            type: 'fluid',
            fluids: Object.fromEntries(fluids),
            timestamp: now
        });
    }

    export function spawnDroppedItem(itemId, x, y, count = 1) {
        let dropId = `drop_${window.user?.uid || 'local'}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const DropClass = (typeof ItemDrop !== 'undefined') ? ItemDrop : (typeof window !== 'undefined' ? window.ItemDrop : null);
        if (DropClass) {
            droppedItems.push(new DropClass(itemId, x, y, count, dropId));
        }
    }

    export function dropItemForWorld(itemId, x, y, count = 1) {
        if (!isMultiplayer || isMultiplayerAuthority()) {
            spawnDroppedItem(itemId, x, y, count);
            return true;
        }
        broadcastDataPacket({
            type: 'drop_request',
            itemId,
            count,
            uid: window.user?.uid || window.fbAuth?.currentUser?.uid,
            timestamp: Date.now()
        });
        return true;
    }

    export function serializeDroppedItem(drop) {
        return { dropId: drop.dropId, itemId: drop.itemId, x: drop.x, y: drop.y, count: drop.count, vx: drop.vx, vy: drop.vy, isGrounded: drop.isGrounded };
    }

    export function deserializeDroppedItem(data) {
        if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.y) || !Number.isFinite(data.itemId)) return null;
        const DropClass = (typeof ItemDrop !== 'undefined') ? ItemDrop : (typeof window !== 'undefined' ? window.ItemDrop : null);
        if (!DropClass) return null;
        let drop = new DropClass(data.itemId, data.x, data.y, data.count || 1, data.dropId);
        drop.vx = data.vx || 0; drop.vy = data.vy || 0; drop.isGrounded = data.isGrounded === true;
        return drop;
    }


    export function applyMultiplayerBlockDiff(x, y, newId, growthAt = null, treeTrunk = false, isBackground = false) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        if (isBackground) {
            if (bgWorld && bgWorld[x]) {
                bgWorld[x][y] = newId;
            }
            return;
        }
        if (!world || !world[x]) return;
        let wasTreeTrunk = nonCollidableTreeWood.has(`${x}_${y}`);
        let wasSolid = world[x]?.[y] !== IDS.AIR;
        let wasSnow = world[x]?.[y] === IDS.SNOW;
        nonCollidableTreeWood.delete(`${x}_${y}`);
        if (newId !== IDS.AIR || wasSolid) removeFluid(x, y);
        world[x][y] = newId;
        if (newId === IDS.WOOD && treeTrunk) nonCollidableTreeWood.add(`${x}_${y}`);
        if (newId === IDS.AIR) {
            notifyBlockedSaplings();
            checkSandFallAbove(x, y);
            dirtToGrassQueue.delete(`${x}_${y}`);
            if (wasSnow) scheduleSnowRegrowth(x, y);
            if (world[x]?.[y + 1] === IDS.DIRT) scheduleDirtToGrass(x, y + 1);
        } else if (newId === IDS.SAND) {
            if (!isSolidWorldBlock(x, y + 1, world[x]?.[y + 1])) triggerSandFall(x, y);
            else checkSandFallAbove(x, y);
        } else if (newId === IDS.DIRT) {
            scheduleDirtToGrass(x, y);
        } else if (newId === IDS.GRASS) {
            dirtToGrassQueue.delete(`${x}_${y}`);
        } else if (newId === IDS.SNOW) {
            snowRegrowthQueue.delete(`${x}_${y}`);
        }
        if (newId === IDS.SAPLING && Number.isFinite(growthAt)) saplingGrowthQueue.set(`${x}_${y}`, growthAt);
        else {
            saplingGrowthQueue.delete(`${x}_${y}`);
            saplingBlockedWarnings.delete(`${x}_${y}`);
        }
        if (newId !== IDS.WHEAT_STAGE_1 && newId !== IDS.WHEAT_STAGE_2 && newId !== IDS.WHEAT_STAGE_3 && newId !== IDS.WHEAT_STAGE_4) {
            cropGrowthQueue.delete(`${x}_${y}`);
        }
        if (wasTreeTrunk && newId === IDS.AIR && isMultiplayerAuthority() && ![...nonCollidableTreeWood].some(cell => cell.startsWith(`${x}_`))) {
            scheduleTreeLeafDecay(x);
        }
    }


    export function processRemotePickupRequests() {
        // Handled reactively via WebRTC data channel onmessage
    }

    export function processRemoteDropRequests() {
        // Handled reactively via WebRTC data channel onmessage
    }

    export function isMultiplayerAuthority() {
        if (!isMultiplayer) return true;
        if (isWebRTCHost) return true;
        if (!window.user?.uid) return false;
        return [window.user.uid, ...mpPeerIds].sort()[0] === window.user.uid;
    }

    export function damageRemotePlayer(playerId, amount, isPoison = false) {
        let remotePlayer = remotePlayers[playerId];
        if (!isMultiplayer || !isMultiplayerAuthority() || !remotePlayer || remotePlayer.damageCooldown > 0) return;
        remotePlayer.damageCooldown = 30;
        if (isPoison) {
            remotePlayer.isPoisoned = true;
            remotePlayer.poisonTimer = 360;
        }
        broadcastDataPacket({
            type: 'damage',
            targetUid: playerId,
            amount: amount,
            isPoison: Boolean(isPoison),
            id: `${Date.now()}-${Math.random()}`
        });
    }

    export function serializeMultiplayerEntity(entity) {
        if (!entity.id) {
            entity.id = 'ent_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
        }
        return Object.fromEntries(Object.entries({
            id: entity.id,
            type: entity.constructor.name, x: entity.x, y: entity.y,
            width: entity.width, height: entity.height, vx: entity.vx, vy: entity.vy,
            isGrounded: entity.isGrounded, health: entity.health,
            damageCooldown: entity.damageCooldown || 0, facingRight: entity.facingRight,
            damageFlashId: entity.damageFlashId,
            tailStrikeTime: entity.tailStrikeTime || 0,
            walkAnimTime: entity.walkAnimTime || 0,
            dir: entity.dir, timer: entity.timer, panic: entity.panic,
            swell: entity.swell, speed: entity.speed, damage: entity.damage, isSheared: entity.isSheared
        }).filter(([, value]) => value !== undefined));
    }

    export function deserializeMultiplayerEntity(data) {
        const constructors = {
            Pig: typeof Pig !== 'undefined' ? Pig : (typeof window !== 'undefined' ? window.Pig : null),
            Chicken: typeof Chicken !== 'undefined' ? Chicken : (typeof window !== 'undefined' ? window.Chicken : null),
            Sheep: typeof Sheep !== 'undefined' ? Sheep : (typeof window !== 'undefined' ? window.Sheep : null),
            Zombie: typeof Zombie !== 'undefined' ? Zombie : (typeof window !== 'undefined' ? window.Zombie : null),
            Creeper: typeof Creeper !== 'undefined' ? Creeper : (typeof window !== 'undefined' ? window.Creeper : null),
            Scorpion: typeof Scorpion !== 'undefined' ? Scorpion : (typeof window !== 'undefined' ? window.Scorpion : null)
        };
        const EntityType = constructors[data.type];
        if (!EntityType || !Number.isFinite(data.x) || !Number.isFinite(data.y)) return null;
        const entity = new EntityType(data.x, data.y);
        entity.id = data.id || ('ent_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now());
        Object.keys(data).forEach(key => {
            if (key !== 'type' && data[key] !== undefined) entity[key] = data[key];
        });
        return entity;
    }

    export let lastReceivedAutosaveId = null;
    export let currentAutosaveBroadcastId = null;

    export function applyMultiplayerWorldState(data) {
        if (!isMultiplayer || !data || !Number.isFinite(data.timestamp) || data.timestamp <= lastWorldStateTimestamp) return;
        lastWorldStateTimestamp = data.timestamp;
        timeOfDay = data.timeOfDay ?? timeOfDay;
        dayCount = data.dayCount ?? dayCount;
        frameCount = data.frameCount ?? frameCount;
        if (data.wakeVersion !== undefined && data.wakeVersion > sleepWakeVersion) {
            sleepWakeVersion = data.wakeVersion;
            isSleeping = false;
        }

        // Synchronized Autosave toast notification across all connected clients
        if (data.lastAutosaveId && data.lastAutosaveId !== lastReceivedAutosaveId) {
            lastReceivedAutosaveId = data.lastAutosaveId;
            if (!isMultiplayerAuthority()) {
                showAutosaveToast(true);
            }
        }

        // Reconcile entities by stable ID without tearing down objects (prevents GC freezing and cross-entity teleporting)
        const incomingEntities = Array.isArray(data.entities) ? data.entities : [];
        const constructors = {
            Pig: typeof Pig !== 'undefined' ? Pig : (typeof window !== 'undefined' ? window.Pig : null),
            Chicken: typeof Chicken !== 'undefined' ? Chicken : (typeof window !== 'undefined' ? window.Chicken : null),
            Sheep: typeof Sheep !== 'undefined' ? Sheep : (typeof window !== 'undefined' ? window.Sheep : null),
            Zombie: typeof Zombie !== 'undefined' ? Zombie : (typeof window !== 'undefined' ? window.Zombie : null),
            Creeper: typeof Creeper !== 'undefined' ? Creeper : (typeof window !== 'undefined' ? window.Creeper : null),
            Scorpion: typeof Scorpion !== 'undefined' ? Scorpion : (typeof window !== 'undefined' ? window.Scorpion : null)
        };
        const newEntities = [];
        for (let i = 0; i < incomingEntities.length; i++) {
            const eData = incomingEntities[i];
            if (!eData || !constructors[eData.type] || !Number.isFinite(eData.x) || !Number.isFinite(eData.y)) continue;
            const curEntities = (entities && entities.length) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : entities);
            let existing = eData.id ? curEntities.find(e => e.id === eData.id && e.constructor.name === eData.type) : null;
            if (!existing && i < curEntities.length && curEntities[i].constructor.name === eData.type && !newEntities.includes(curEntities[i])) {
                existing = curEntities[i];
            }
            if (existing) {
                Object.keys(eData).forEach(k => {
                    if (k !== 'type' && eData[k] !== undefined) existing[k] = eData[k];
                });
                newEntities.push(existing);
            } else {
                const created = deserializeMultiplayerEntity(eData);
                if (created) newEntities.push(created);
            }
        }
        entities = newEntities;
        if (typeof window !== 'undefined') {
            window.entities = newEntities;
            if (typeof window.setEngineEntities === 'function') window.setEngineEntities(newEntities);
        }

        // Reconcile dropped items
        const incomingDrops = Array.isArray(data.droppedItems) ? data.droppedItems : [];
        const newDrops = [];
        for (let i = 0; i < incomingDrops.length; i++) {
            const dData = incomingDrops[i];
            if (!dData || !Number.isFinite(dData.x) || !Number.isFinite(dData.y)) continue;
            let existing = droppedItems.find(d => d.dropId === dData.dropId);
            if (existing) {
                existing.x = dData.x; existing.y = dData.y;
                existing.vx = dData.vx || 0; existing.vy = dData.vy || 0;
                existing.count = dData.count || 1;
                existing.isGrounded = dData.isGrounded === true;
                newDrops.push(existing);
            } else {
                const created = deserializeDroppedItem(dData);
                if (created) newDrops.push(created);
            }
        }
        droppedItems = newDrops;

        if (typeof updateSleepStatus === 'function') updateSleepStatus();
        else if (typeof window !== 'undefined' && typeof window.updateSleepStatus === 'function') window.updateSleepStatus();
    }

    export let lastSentLocalPlayerPos = { x: 0, y: 0, vx: 0, vy: 0, facingRight: true, heldItem: null, health: 20 };

    export function syncMultiplayerWorldState(isAutosave = false) {
        if (!isMultiplayer || !isMultiplayerAuthority() || !window.user || (Date.now() - lastWorldSyncTime < 50 && !isAutosave)) return;
        lastWorldSyncTime = Date.now();
        const payload = {
            type: 'world_state',
            timeOfDay,
            dayCount,
            frameCount,
            wakeVersion: sleepWakeVersion,
            entities: entities.map(serializeMultiplayerEntity),
            droppedItems: droppedItems.map(serializeDroppedItem),
            timestamp: Date.now(),
            authorityId: window.user.uid
        };
        broadcastDataPacket(payload);
    }

    export function broadcastPlayerState(immediate = false) {
        const user = window.user || window.fbAuth?.currentUser;
        if (!isMultiplayer || !user || !currentMpRoom) return;

        const now = Date.now();
        const timeSinceLastSync = now - lastSyncTime;

        const isMovingNow = Boolean(
            Math.abs(player.vx) > 0.08 || Math.abs(player.vy) > 0.08 ||
            isActionActive('left') || isActionActive('right') ||
            isActionActive('jump') || isActionActive('down')
        );

        // Throttle to ~60Hz when moving, 100ms heartbeat when idle
        const minSyncInterval = isMovingNow ? 16 : 100;

        if (!immediate && timeSinceLastSync < minSyncInterval) {
            return;
        }

        let activeId = inventory[selectedHotbarIndex] ? inventory[selectedHotbarIndex].id : null;
        const currentSkinJson = JSON.stringify(getSkinSaveData());
        const skinChanged = currentSkinJson !== lastSentSkinData;
        if (skinChanged) lastSentSkinData = currentSkinJson;

        lastSyncTime = now;
        lastSentLocalPlayerPos.x = player.x;
        lastSentLocalPlayerPos.y = player.y;
        lastSentLocalPlayerPos.vx = player.vx;
        lastSentLocalPlayerPos.vy = player.vy;
        lastSentLocalPlayerPos.facingRight = Boolean(player.facingRight);
        lastSentLocalPlayerPos.heldItem = activeId;
        lastSentLocalPlayerPos.health = player.health;

        const cleanArmor = Array.isArray(equippedArmor)
            ? equippedArmor.map(item => item ? { id: item.id, count: 1, ...(item.durability !== undefined ? { durability: item.durability } : {}) } : null)
            : [null, null, null, null];

        const payload = {
            type: 'pos',
            uid: user.uid,
            playerName: (playerName || 'Player').slice(0, 16),
            x: Math.round(player.x * 10) / 10,
            y: Math.round(player.y * 10) / 10,
            vx: Math.round((player.vx || 0) * 100) / 100,
            vy: Math.round((player.vy || 0) * 100) / 100,
            isMoving: isMovingNow,
            facingRight: Boolean(player.facingRight),
            isClimbing: Boolean(player.isClimbing),
            isDead: Boolean(player.isDead),
            heldItem: activeId,
            health: Number(player.health) || 20,
            oxygen: Number(player.oxygen) || 20,
            sleeping: Boolean(isSleeping),
            isPoisoned: Boolean(player.poisonTimer > 0),
            poisonTimer: Number(player.poisonTimer) || 0,
            equippedArmor: cleanArmor,
            anim: player.walkAnimTime || 0,
            timestamp: now
        };

        if (skinChanged || immediate) {
            payload.skinData = currentSkinJson;
        }

        broadcastDataPacket(payload);
    }
    export const syncLocalPlayerState = broadcastPlayerState;
    

    export function closeRoomDialogs() {
        document.getElementById('multiplayer-modal').classList.add('hidden');
    }

    export function switchMpTab(tabId) {
        // Update tab buttons
        document.getElementById('tab-btn-join').classList.toggle('active-mp-tab', tabId === 'join');
        document.getElementById('tab-btn-host').classList.toggle('active-mp-tab', tabId === 'host');
        
        // Update content panels
            document.getElementById('mp-tab-join').classList.toggle('hidden', tabId !== 'join');
            document.getElementById('mp-tab-host').classList.toggle('hidden', tabId !== 'host');
        
        if (tabId === 'join') {
            setMpFilter('all');
        } else if (tabId === 'host') {
            selectMpGameMode('survival');
        }
    }

    export function selectMpGameMode(mode) {
        mpCurrentGameMode = mode;
        // Update mode buttons
        document.querySelectorAll('#mp-tab-host .mp-mode-button').forEach(btn => {
            btn.classList.toggle('active-mp-mode', btn.dataset.mode === mode);
        });
        
        // Show/hide panels
        document.getElementById('mp-survival-panel').classList.toggle('hidden', mode !== 'survival');
        document.getElementById('mp-minigames-panel').classList.toggle('hidden', mode !== 'minigames');
        
        if (mode === 'survival') {
            selectMpDifficulty('normal');
        }
    }

    export function setMpFilter(filter) {
        // Update filter buttons
        document.querySelectorAll('#mp-filter-selector .mp-filter-button').forEach(btn => {
            btn.classList.toggle('active-mp-filter', btn.dataset.filter === filter);
        });
        
        loadAvailableRooms(filter);
    }

    export let mpCurrentFilter = 'all';
    export let mpCurrentGameMode = 'survival';

    export function openMultiplayerMenu() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('multiplayer-modal').classList.remove('hidden');
        document.getElementById('mp-player-name').value = playerName;
        switchMpTab('join');
    }
    
    export function closeMultiplayerMenu() {
        document.getElementById('multiplayer-modal').classList.add('hidden');
        showMainMenu();
    }

    export function selectMpDifficulty(diffKey) {
        mpCreateDifficulty = diffKey;
        document.querySelectorAll('#mp-diff-selector .diff-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.diff === diffKey));
        const description = document.getElementById('mp-diff-desc');
        if (description) description.innerText = diffDescriptions[diffKey];
        const keepInventoryInput = document.getElementById('mp-keep-inventory');
        keepInventoryInput.disabled = diffKey === 'hardcore';
        if (diffKey === 'hardcore') keepInventoryInput.checked = false;
        updateMpAchievementWarning();
    }

    export async function ensureFirebase() {
        if (!window.fbAuth) {
            showToast("Multiplayer is unavailable: this file has no Firebase configuration.");
            return false;
        }
        if (!window.user && !window.fbAuth.currentUser) {
            let ok = await window.initFirebase();
            if(!ok) { showToast("Could not connect to the multiplayer server."); return false; }
        }
        if (window.fbAuth.currentUser) {
            window.user = window.fbAuth.currentUser;
        }
        return Boolean(window.user);
    }

    export async function hashRoomPassword(password) {
        try {
            if (typeof TextEncoder !== 'undefined' && window.crypto && window.crypto.subtle) {
                const bytes = new TextEncoder().encode(password);
                const digest = await window.crypto.subtle.digest('SHA-256', bytes);
                return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
            }
        } catch(e) {}
        let hash = 5381;
        for (let i = 0; i < password.length; i++) hash = ((hash << 5) + hash) + password.charCodeAt(i) | 0;
        return 'hash_' + (hash >>> 0).toString(16);
    }

    export function cleanUpPeerConnection() {
        if (gameDataChannel) {
            try { gameDataChannel.close(); } catch(e) {}
            gameDataChannel = null;
        }
        if (peerConnection) {
            try { peerConnection.close(); } catch(e) {}
            peerConnection = null;
        }
        isWebRTCHost = false;
    }

    export function broadcastDataPacket(packet) {
        if (!gameDataChannel || gameDataChannel.readyState !== 'open') return;
        try {
            const raw = typeof packet === 'string' ? packet : JSON.stringify(packet);
            gameDataChannel.send(raw);
        } catch(e) {
            console.error("WebRTC data channel send error", e);
        }
    }

    export function setupDataChannelListeners(channel) {
        if (!channel) return;

        channel.onopen = () => {
            console.log("WebRTC Channel Open! No more lag.");
            isMultiplayer = true;
            setMultiplayerLoadingStatus('Ready', 100);
            setTimeout(() => {
                hideMultiplayerLoading();
                document.getElementById('hud').style.display = 'block';
                document.getElementById('gameCanvas').classList.remove('hidden');
                STATE = 'PLAYING';
                updateUI(); updateHealthUI(); updateHungerUI(); updateTimeUI(); updateArmorUI(); updateHudArmorBar();
                broadcastPlayerState(true);
                if (isMultiplayerAuthority()) {
                    syncMultiplayerWorldState(true);
                    syncFluidState();
                }
                showToast("Connected to " + (currentMpWorldName || "multiplayer room"));
            }, 100);
        };

        channel.onclose = () => {
            console.log("WebRTC Channel Closed.");
            if (isMultiplayer) {
                showToast("Multiplayer peer disconnected.");
            }
        };

        channel.onerror = (err) => {
            console.error("WebRTC Data Channel error:", err);
        };

        channel.onmessage = (event) => {
            try {
                const packet = JSON.parse(event.data);
                if (!packet || !packet.type) return;

                const currentUid = window.user?.uid || window.fbAuth?.currentUser?.uid;

                switch (packet.type) {
                    case 'pos': {
                        if (packet.uid === currentUid) return;
                        mpPeerIds.add(packet.uid);

                        if (!remotePlayers[packet.uid]) {
                            const rCanvas = document.createElement('canvas');
                            compileRemoteSkin(getDefaultSkinData(), rCanvas);
                            remotePlayers[packet.uid] = {
                                canvas: rCanvas,
                                renderX: Number.isFinite(packet.x) ? packet.x : player.x,
                                renderY: Number.isFinite(packet.y) ? packet.y : player.y,
                                targetX: Number.isFinite(packet.x) ? packet.x : player.x,
                                targetY: Number.isFinite(packet.y) ? packet.y : player.y,
                                x: Number.isFinite(packet.x) ? packet.x : player.x,
                                y: Number.isFinite(packet.y) ? packet.y : player.y,
                                vx: Number.isFinite(packet.vx) ? packet.vx : 0,
                                vy: Number.isFinite(packet.vy) ? packet.vy : 0,
                                isMoving: Boolean(packet.isMoving),
                                facingRight: packet.facingRight !== false,
                                health: Number.isFinite(packet.health) ? packet.health : 20,
                                playerName: packet.playerName || 'Player',
                                isDead: packet.isDead === true,
                                isClimbing: Boolean(packet.isClimbing),
                                isPoisoned: Boolean(packet.isPoisoned),
                                poisonTimer: packet.poisonTimer || 0,
                                heldItem: packet.heldItem || null,
                                damageCooldown: 0,
                                equippedArmor: Array.isArray(packet.equippedArmor) ? packet.equippedArmor : [null, null, null, null],
                                lastSeenLocalTime: Date.now(),
                                initializedHealth: true
                            };
                        }

                        let rp = remotePlayers[packet.uid];
                        rp.lastSeenLocalTime = Date.now();
                        rp.playerName = packet.playerName || rp.playerName || 'Player';

                        if (packet.isPoisoned !== undefined) {
                            rp.isPoisoned = Boolean(packet.isPoisoned);
                            rp.poisonTimer = packet.poisonTimer || (packet.isPoisoned ? 360 : 0);
                        }

                        if (packet.health !== undefined) {
                            if (rp.initializedHealth && rp.health !== undefined && packet.health < rp.health && !packet.isDead) {
                                let dmgTaken = rp.health - packet.health;
                                let rDrawX = (rp.renderX !== undefined ? rp.renderX : (Number.isFinite(packet.x) ? packet.x : rp.x || 0)) + (TILE_SIZE * 0.75) / 2;
                                let rDrawY = (rp.renderY !== undefined ? rp.renderY : (Number.isFinite(packet.y) ? packet.y : rp.y || 0)) - 10;
                                let txtColor = (packet.isPoisoned || rp.isPoisoned) ? "#4ade80" : "#ff3333";
                                floatingTexts.push(new FloatingText(rDrawX, rDrawY, "-" + dmgTaken, txtColor));
                                rp.damageCooldown = 15;
                                for (let i = 0; i < 6; i++) {
                                    let p = new Particle(rDrawX, rDrawY + 20, txtColor);
                                    p.vx = (Math.random() - 0.5) * 3;
                                    p.vy = -1.5 - Math.random() * 1.5;
                                    particles.push(p);
                                }
                            }
                            rp.health = packet.health;
                            rp.initializedHealth = true;
                        }

                        if (Number.isFinite(packet.x) && Number.isFinite(packet.y)) {
                            const currentDist = Math.hypot(packet.x - (rp.renderX ?? packet.x), packet.y - (rp.renderY ?? packet.y));
                            if (rp.renderX === undefined || currentDist > TILE_SIZE * 16 || rp.isDead !== packet.isDead) {
                                rp.renderX = packet.x;
                                rp.renderY = packet.y;
                            }
                            rp.targetX = packet.x;
                            rp.targetY = packet.y;
                            rp.x = packet.x;
                            rp.y = packet.y;
                            rp.vx = Number.isFinite(packet.vx) ? packet.vx : 0;
                            rp.vy = Number.isFinite(packet.vy) ? packet.vy : 0;
                            rp.isMoving = Boolean(packet.isMoving || Math.abs(rp.vx) > 0.08);
                            rp.facingRight = packet.facingRight !== false;
                            rp.isDead = packet.isDead === true;
                            rp.sleeping = Boolean(packet.sleeping);
                            rp.isClimbing = Boolean(packet.isClimbing);
                            rp.heldItem = packet.heldItem || null;
                            if (Array.isArray(packet.equippedArmor)) rp.equippedArmor = packet.equippedArmor;
                            rp.lastNetworkTimestamp = Date.now();
                        }

                        if (packet.skinData && packet.skinData !== rp.lastSkinData) {
                            rp.lastSkinData = packet.skinData;
                            try {
                                const parsedSkin = JSON.parse(packet.skinData);
                                compileRemoteSkin(parsedSkin, rp.canvas);
                            } catch(e) {
                                compileRemoteSkin(getDefaultSkinData(), rp.canvas);
                            }
                        } else if (!rp.lastSkinData && rp.canvas) {
                            compileRemoteSkin(getDefaultSkinData(), rp.canvas);
                        }
                        updateSleepStatus();
                        break;
                    }

                    case 'block': {
                        applyMultiplayerBlockDiff(packet.x, packet.y, packet.newId, packet.growthAt, packet.treeTrunk === true, packet.isBackground === true);
                        break;
                    }

                    case 'snowball': {
                        if (packet.uid !== currentUid && Number.isFinite(packet.x) && Number.isFinite(packet.y)) {
                            activeProjectiles.push(new SnowballProjectile(packet.x, packet.y, packet.vx, packet.vy, packet.uid, packet.id));
                        }
                        break;
                    }

                    case 'damage': {
                        if (packet.targetUid === currentUid) {
                            player.takeDamage(packet.amount || 1);
                            if (packet.isPoison) {
                                player.poisonTimer = 360;
                                updateHealthUI();
                            }
                        } else if (remotePlayers[packet.targetUid]) {
                            const rp = remotePlayers[packet.targetUid];
                            rp.damageCooldown = 15;
                        }
                        break;
                    }

                    case 'chat': {
                        appendChatMessage(packet, true);
                        break;
                    }

                    case 'chest': {
                        applyChestState(packet.key, packet);
                        break;
                    }

                    case 'world_state': {
                        if (!isMultiplayerAuthority()) {
                            applyMultiplayerWorldState(packet);
                        }
                        break;
                    }

                    case 'fluid': {
                        if (!isMultiplayerAuthority() && packet.fluids) {
                            fluids = new Map(Object.entries(packet.fluids));
                        }
                        break;
                    }

                    case 'pickup_request': {
                        if (isMultiplayerAuthority()) {
                            const dropIdx = droppedItems.findIndex(d => d.dropId === packet.dropId);
                            if (dropIdx !== -1) {
                                const drop = droppedItems[dropIdx];
                                droppedItems.splice(dropIdx, 1);
                                broadcastDataPacket({
                                    type: 'pickup_result',
                                    targetUid: packet.uid,
                                    id: packet.dropId,
                                    itemId: drop.itemId,
                                    count: drop.count
                                });
                            }
                        }
                        break;
                    }

                    case 'pickup_result': {
                        if (packet.targetUid === currentUid) {
                            if (giveItem(packet.itemId, packet.count)) {
                                pendingPickupRequest = null;
                                updateUI();
                            }
                        }
                        break;
                    }

                    case 'drop_request': {
                        if (isMultiplayerAuthority() && packet.itemId) {
                            const sender = remotePlayers[packet.uid];
                            const dropX = sender ? sender.x + TILE_SIZE * 0.375 : player.x;
                            const dropY = sender ? sender.y : player.y;
                            spawnDroppedItem(packet.itemId, dropX, dropY, packet.count || 1);
                        }
                        break;
                    }

                    case 'leave': {
                        if (packet.uid) {
                            delete remotePlayers[packet.uid];
                            mpPeerIds.delete(packet.uid);
                            updateSleepStatus();
                        }
                        break;
                    }
                }
            } catch(err) {
                console.error("Error processing WebRTC data channel packet", err);
            }
        };
    }

    export async function createMultiplayerRoom() {
        let name = document.getElementById('mp-player-name').value.trim();
        let worldName = document.getElementById('mp-world-name').value.trim();
        let password = document.getElementById('mp-create-password').value.trim();
        let gameMode = mpCurrentGameMode || 'survival';
        let minigameType = gameMode === 'minigames' ? (document.getElementById('mp-minigame-type')?.value || 'skyblock') : null;
        let starterItems = gameMode === 'survival' && document.getElementById('mp-starter-items').checked;
        let roomKeepInventory = gameMode === 'survival' && mpCreateDifficulty !== 'hardcore' && document.getElementById('mp-keep-inventory').checked;
        let roomAchievementsEnabled = gameMode === 'survival' && (!starterItems && !roomKeepInventory);
        if (!name) {
            showToast("Enter a character name first.");
            const nameInput = document.getElementById('mp-player-name');
            if (nameInput) nameInput.focus();
            return;
        }
        if (!worldName) { showToast("Enter a world name."); return; }
        if (!/^\d{4,}$/.test(password)) { showToast("Password must contain at least 4 digits."); return; }

        const isFirstTime = typeof localStorage !== 'undefined' && !localStorage.getItem('webcraft_tutorial_seen');
        if (isFirstTime && typeof window.openTutorialModal === 'function') {
            window.openTutorialModal(0, {
                onboarding: true,
                onComplete: () => {
                    createMultiplayerRoom();
                }
            });
            return;
        }

        showMultiplayerLoading('Preparing multiplayer world');
        if (!await ensureFirebase()) return;
        playerName = name.slice(0, 16); localStorage.setItem('swc_player_name', playerName);
        let roomName = 'room_' + window.user.uid + '_' + Date.now();
        const { doc, setDoc, collection } = window.fbModules;
        let seed = Math.floor(Math.random() * 100000);
        let passwordHash = await hashRoomPassword(password);
        showMultiplayerLoading(roomName);

        // 1. Initialize WebRTC Host PeerConnection & DataChannel
        cleanUpPeerConnection();
        peerConnection = new RTCPeerConnection(rtcConfig);
        isWebRTCHost = true;

        gameDataChannel = peerConnection.createDataChannel('webcraft2d_sync', {
            ordered: false,
            maxRetransmits: 0
        });
        setupDataChannelListeners(gameDataChannel);

        const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);

        // 2. Gather Host ICE Candidates
        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                const candidateRef = doc(collection(roomRef, 'hostCandidates'));
                setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Host ICE candidate push error", e));
            }
        });

        // 3. Create Offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // 4. Save Room Document with Offer to Firestore
        await setDoc(roomRef, {
            worldName, gameMode, minigameType, difficulty: mpCreateDifficulty, worldSize: selectedMpWorldSize, starterItems, keepInventory: roomKeepInventory, achievementsEnabled: roomAchievementsEnabled, passwordHash, seed, timeOfDay: 0.2, gameVersion: GAME_VERSION, gameBuild: GAME_BUILD,
            createdAt: Date.now(), ownerId: window.user.uid, status: 'open',
            offer: { type: offer.type, sdp: offer.sdp }
        });

        await connectToMultiplayerRoom(roomName, passwordHash, false, true /* isHost */);
    }

    export async function loadAvailableRooms(filter = 'all') {
        mpCurrentFilter = filter;
        const list = document.getElementById('mp-room-list');
        list.innerHTML = '<p class="text-gray-300 text-lg text-center">Loading worlds...</p>';
        try {
            const { collection, getDocs } = window.fbModules;
            const snap = await getDocs(collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms'));
            list.innerHTML = '';
            let rooms = snap.docs.map(roomDoc => ({ id: roomDoc.id, ...roomDoc.data() }))
                .filter(room => room.status !== 'closed' && typeof room.passwordHash === 'string');
            
            // Apply filter
            if (filter === 'survival') {
                rooms = rooms.filter(room => room.gameMode !== 'minigames');
            } else if (filter === 'minigames') {
                rooms = rooms.filter(room => room.gameMode === 'minigames');
            }
            
            if (!rooms.length) { 
                list.innerHTML = '<p class="text-gray-400 text-lg text-center">No worlds found.</p>'; 
                return; 
            }
            rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(room => {
                let isCompatible = (room.gameVersion === GAME_VERSION && room.gameBuild === GAME_BUILD);
                let button = document.createElement('button');
                button.className = 'w-full text-left p-2 mb-1 bg-gray-600 hover:bg-gray-500 border-2 border-gray-400 text-white font-[\'VT323\'] text-lg flex items-center gap-2';
                if (!isCompatible) button.classList.add('opacity-60');
                let modeLabel = room.gameMode === 'minigames' ? (room.minigameType || 'skyblock').toUpperCase() : 'SURVIVAL';
                let modeClass = room.gameMode === 'minigames' ? 'mp-room-badge-minigame' : 'mp-room-badge-survival';
                let difficulty = (room.difficulty || 'normal').toLowerCase();
                let sizeLabel = (room.worldSize || 'small').toUpperCase();
                let versionLabel = room.gameVersion || 'older';
                let versionBadgeClass = isCompatible ? 'mp-room-badge-version' : 'mp-room-badge-version-invalid';
                button.innerHTML = `<span class="mp-room-badge ${modeClass}">${modeLabel}</span><span class="mp-room-badge font-['VT323'] bg-slate-700 text-slate-200">${sizeLabel}</span><span class="mp-room-badge mp-room-badge-${difficulty}">${difficulty.toUpperCase()}</span><span class="mp-room-badge ${versionBadgeClass}">v${versionLabel}</span>${!isCompatible ? '<span class="mp-room-badge mp-room-badge-version-invalid font-[\'VT323\']">INCOMPATIBLE</span>' : ''}<span>${room.worldName || room.id}</span>`;
                button.onclick = () => {
                    if (!isCompatible) {
                        showToast(`Cannot join world '${room.worldName || room.id}': Incompatible version (Room is v${room.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                        selectedJoinRoom = null;
                        document.querySelectorAll('#mp-room-list button').forEach(item => item.classList.remove('!bg-yellow-600'));
                        document.getElementById('mp-join-password').disabled = true;
                        document.getElementById('btn-mp-join').disabled = true;
                        return;
                    }
                    selectedJoinRoom = room;
                    document.querySelectorAll('#mp-room-list button').forEach(item => item.classList.remove('!bg-yellow-600'));
                    button.classList.add('!bg-yellow-600');
                    document.getElementById('mp-join-password').disabled = false;
                    document.getElementById('btn-mp-join').disabled = false;
                    document.getElementById('mp-join-password').focus();
                };
                list.appendChild(button);
            });
        } catch (e) {
            console.error('Room listing failed', e);
            list.innerHTML = '<p class="text-red-300 text-xl text-center">Could not load worlds.</p>';
        }
    }

    export async function joinSelectedRoom() {
        if (!selectedJoinRoom) { showToast("Select a world first."); return; }
        if (selectedJoinRoom.gameVersion !== GAME_VERSION || selectedJoinRoom.gameBuild !== GAME_BUILD) {
            showToast(`Cannot join world: Incompatible version (Room is v${selectedJoinRoom.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
            return;
        }
        let password = document.getElementById('mp-join-password').value.trim();
        if (!/^\d{4,}$/.test(password) || await hashRoomPassword(password) !== selectedJoinRoom.passwordHash) { showToast("Incorrect world password."); return; }
        let name = document.getElementById('mp-player-name').value.trim();
        if (!name) {
            showToast("Enter a character name first.");
            const nameInput = document.getElementById('mp-player-name');
            if (nameInput) nameInput.focus();
            return;
        }

        const isFirstTime = typeof localStorage !== 'undefined' && !localStorage.getItem('webcraft_tutorial_seen');
        if (isFirstTime && typeof window.openTutorialModal === 'function') {
            window.openTutorialModal(0, {
                onboarding: true,
                onComplete: () => {
                    joinSelectedRoom();
                }
            });
            return;
        }

        playerName = name.slice(0, 16); localStorage.setItem('swc_player_name', playerName);
        showMultiplayerLoading(selectedJoinRoom.id);
        await connectToMultiplayerRoom(selectedJoinRoom.id, await hashRoomPassword(password), false, false /* isGuest */);
    }

    export function setMultiplayerLoadingStatus(status, progress) {
        const statusEl = document.getElementById('multiplayer-loading-status');
        const fillEl = document.getElementById('multiplayer-loading-fill');
        if (statusEl) statusEl.innerText = status;
        if (fillEl) fillEl.style.width = `${Math.max(8, Math.min(100, progress))}%`;
    }

    export function showMultiplayerLoadingError(message) {
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (errorEl) { errorEl.innerText = message; errorEl.classList.add('visible'); }
        if (actionsEl) actionsEl.classList.remove('hidden');
        setMultiplayerLoadingStatus('Connection paused', 100);
    }

    export function resetMultiplayerLoadingScreen(roomName) {
        const titleEl = document.getElementById('multiplayer-loading-title');
        const roomEl = document.getElementById('multiplayer-loading-room');
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (titleEl) titleEl.innerText = 'Connecting to Server';
        if (roomEl) roomEl.innerText = `Joining ${roomName}`;
        if (errorEl) { errorEl.innerText = ''; errorEl.classList.remove('visible'); }
        if (actionsEl) actionsEl.classList.add('hidden');
        setMultiplayerLoadingStatus('Signing in', 12);
    }

    export function showMultiplayerLoading(roomName) {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        document.getElementById('multiplayer-modal').classList.add('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('worlds-menu').classList.add('hidden');
        document.getElementById('shared-menu-bg').classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        loadingScreen.style.setProperty('display', 'flex', 'important');
        loadingScreen.style.setProperty('z-index', '400', 'important');
        loadingScreen.style.setProperty('background', 'rgba(0, 0, 0, 0.9)', 'important');
        resetMultiplayerLoadingScreen(roomName);
    }

    export function hideMultiplayerLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        loadingScreen.classList.add('hidden');
        loadingScreen.style.removeProperty('display');
        loadingScreen.style.removeProperty('z-index');
        loadingScreen.style.removeProperty('background');
    }

    export function showSingleplayerLoading(worldName) {
        const titleEl = document.getElementById('multiplayer-loading-title');
        const roomEl = document.getElementById('multiplayer-loading-room');
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (titleEl) titleEl.innerText = 'Loading World';
        if (roomEl) roomEl.innerText = worldName ? `Opening ${worldName}` : 'Opening single-player world';
        if (errorEl) { errorEl.innerText = ''; errorEl.classList.remove('visible'); }
        if (actionsEl) actionsEl.classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');
        setMultiplayerLoadingStatus('Preparing world', 18);
    }

    export function hideSingleplayerLoading() {
        hideMultiplayerLoading();
    }

    export function retryMultiplayerConnection() {
        if (!lastMultiplayerConnection) return;
        const { roomName, password } = lastMultiplayerConnection;
        connectToMultiplayerRoom(roomName, password);
    }

    export function cancelMultiplayerConnection() {
        multiplayerConnectionAttempt++;
        cleanUpPeerConnection();
        mpUnsubscribers.forEach(unsubscribe => unsubscribe());
        mpUnsubscribers = [];
        isMultiplayer = false;
        currentMpRoom = null;
        closeChat();
        const chatContainer = document.getElementById('mp-chat-container');
        if (chatContainer) chatContainer.classList.add('hidden');
        const chatMessages = document.getElementById('mp-chat-messages');
        if (chatMessages) chatMessages.innerHTML = '';
        chatSeenMessageIds = new Set();
        hideMultiplayerLoading();
        document.getElementById('shared-menu-bg').classList.remove('hidden');
        showMainMenu();
    }

    export async function connectToMultiplayerRoom(roomName, password, preserveLocalHostState = false, isHost = false) {
        const connectionAttempt = ++multiplayerConnectionAttempt;
        lastMultiplayerConnection = { roomName, password };
        showMultiplayerLoading(roomName);
        if (!await ensureFirebase()) {
            if (connectionAttempt === multiplayerConnectionAttempt) cancelMultiplayerConnection();
            return;
        }
        
        isMultiplayer = true; currentMpRoom = roomName; currentDifficulty = 'normal';
        mpPeerIds = new Set([window.user.uid]);
        lastWorldSyncTime = 0; lastWorldStateTimestamp = 0; pendingDropRequest = null;
        isSleeping = false; sleepWakeVersion = 0;
        document.getElementById('mp-room-display').innerText = currentMpWorldName || roomName;
        document.getElementById('room-indicator').classList.remove('hidden');
        document.getElementById('btn-quit-to-menu').innerText = "Disconnect / Quit to Title";
        
        const { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs } = window.fbModules;
        const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);
        
        try {
            setMultiplayerLoadingStatus('Checking room details', 28);
            let roomSnap = await getDoc(roomRef);
            if (connectionAttempt !== multiplayerConnectionAttempt) return;
            if (!roomSnap.exists() || roomSnap.data().passwordHash !== password) throw new Error('Room not found or password invalid');
            let roomData = roomSnap.data();
            if (roomData.gameVersion !== GAME_VERSION || roomData.gameBuild !== GAME_BUILD) {
                throw new Error(`Incompatible version: World is v${roomData.gameVersion || 'older'} (${roomData.gameBuild || 'legacy'}), but client is v${GAME_VERSION} (${GAME_BUILD}).`);
            }
            let targetSeed = roomData.seed;
            currentMpWorldName = roomData.worldName || roomName;
            currentDifficulty = roomData.difficulty || 'normal';
            keepInventory = currentDifficulty !== 'hardcore' && roomData.keepInventory === true;
            currentWorldAchievementsEnabled = (roomData.starterItems !== true && roomData.keepInventory !== true && roomData.achievementsEnabled !== false);
            timeOfDay = roomData.timeOfDay ?? 0.2;
            let targetSize = roomData.worldSize || (roomData.worldWidth > 700 ? 'big' : 'small');
            setWorldDimensions(targetSize);
            document.getElementById('mp-room-display').innerText = currentMpWorldName;
            
            if (!preserveLocalHostState) {
                if (roomData.hasCustomWorld) {
                    setMultiplayerLoadingStatus('Downloading custom world', 44);
                    let customWorldRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_custom_worlds', roomName);
                    let cwSnap = await getDoc(customWorldRef);
                    if (!cwSnap.exists()) {
                        let legacyWorldStateRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_world_states', roomName);
                        cwSnap = await getDoc(legacyWorldStateRef);
                    }
                    const cwData = cwSnap.exists() ? cwSnap.data() : null;

                    if (cwData && cwData.isChunked) {
                        setMultiplayerLoadingStatus('Downloading world chunks', 46);
                        world = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        
                        const chunksSnap = await getDocs(collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'world_chunks_' + roomName));
                        setMultiplayerLoadingStatus('Reconstructing terrain', 56);
                        chunksSnap.forEach(chunkDoc => {
                            const cData = chunkDoc.data();
                            if (cData && Number.isInteger(cData.cx) && Number.isInteger(cData.cy)) {
                                decompressChunkInto(cData.rle, world, cData.cx * MP_CHUNK_SIZE, cData.cy * MP_CHUNK_SIZE, MP_CHUNK_SIZE, MP_CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT);
                                if (cData.bgRle) {
                                    decompressChunkInto(cData.bgRle, bgWorld, cData.cx * MP_CHUNK_SIZE, cData.cy * MP_CHUNK_SIZE, MP_CHUNK_SIZE, MP_CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT);
                                }
                            }
                        });

                        if (Array.isArray(cwData.nonCollidableTreeWood)) {
                            nonCollidableTreeWood = new Set(cwData.nonCollidableTreeWood);
                        }
                        if (cwData.saplingGrowthQueue) {
                            saplingGrowthQueue = new Map(Object.entries(cwData.saplingGrowthQueue).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)));
                        }
                        if (cwData.cropGrowthQueue) {
                            cropGrowthQueue = new Map(Object.entries(cwData.cropGrowthQueue));
                        }
                        if (Array.isArray(cwData.furnaces)) {
                            furnaces = cwData.furnaces;
                        }
                    } else if (cwData && cwData.worldRle) {
                        world = decompressWorld(cwData.worldRle, WORLD_WIDTH, WORLD_HEIGHT);
                        if (cwData.bgWorldRle) {
                            bgWorld = decompressWorld(cwData.bgWorldRle, WORLD_WIDTH, WORLD_HEIGHT);
                        } else {
                            bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        }
                        if (Array.isArray(cwData.nonCollidableTreeWood)) {
                            nonCollidableTreeWood = new Set(cwData.nonCollidableTreeWood);
                        }
                        if (cwData.saplingGrowthQueue) {
                            saplingGrowthQueue = new Map(Object.entries(cwData.saplingGrowthQueue).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)));
                        }
                        if (cwData.cropGrowthQueue) {
                            cropGrowthQueue = new Map(Object.entries(cwData.cropGrowthQueue));
                        }
                        if (Array.isArray(cwData.furnaces)) {
                            furnaces = cwData.furnaces;
                        }
                    } else {
                        generateWorld(targetSeed);
                    }
                } else {
                    setMultiplayerLoadingStatus('Generating world', 46);
                    generateWorld(targetSeed);
                }

                surfaceHeights = new Array(WORLD_WIDTH);
                const nonGround = new Set([IDS.AIR, IDS.LEAVES, IDS.WOOD, IDS.TORCH, IDS.SAPLING, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP]);
                for (let x = 0; x < WORLD_WIDTH; x++) {
                    let surfY = WORLD_HEIGHT - 1;
                    for (let y = 0; y < WORLD_HEIGHT; y++) {
                        let b = world[x]?.[y];
                        if (b !== undefined && !nonGround.has(b)) {
                            surfY = y;
                            break;
                        }
                    }
                    surfaceHeights[x] = surfY;
                }
            }

            ensureTreeWoodNonCollidable();
            
            // Multiplayer Chat setup
            initChatEvents();
            chatSeenMessageIds = new Set();
            const chatMessagesContainer = document.getElementById('mp-chat-messages');
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
            document.getElementById('mp-chat-container')?.classList.remove('hidden');
            
            if (!preserveLocalHostState) {
                setMultiplayerLoadingStatus('Restoring player', 60);
                const spawn = getInitialSpawnPoint();
                player.x = spawn.x; player.y = spawn.y;
                player.fallStartY = spawn.y;
                player.isGrounded = true;
                caveSkyOpacity = getPlayerCaveSkyOpacity();
                player.health = player.maxHealth; player.hunger = 20; player.exhaustion = 0; player.oxygen = player.maxOxygen;
                player.isDead = false; player.vy = 0; player.vx = 0; player.damageCooldown = 60;
                entities = []; remotePlayers = {};
                if (!Array.isArray(furnaces)) furnaces = [];
                inventory.fill(null);
                equippedArmor = [null, null, null, null];
                if (roomData.starterItems !== false) {
                    giveItem(IDS.WOOD_AXE, 1); giveItem(IDS.WOOD_PICKAXE, 1); giveItem(IDS.WOOD, 16); giveItem(IDS.COOKED_PORKCHOP, 10); giveItem(IDS.TORCH, 32);
                }
                camera.x = player.x + player.width / 2 - canvas.width / 2;
                camera.y = player.y + player.height / 2 - canvas.height / 2;
                camera.x = Math.max(-canvas.width / 3, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - canvas.width + canvas.width / 3));
                camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - canvas.height));
            } else {
                remotePlayers = {};
                caveSkyOpacity = getPlayerCaveSkyOpacity();
                player.damageCooldown = 60;
                player.isDead = false;
            }

            // WebRTC Signaling Sequence
            if (isHost) {
                // HOST: Listen for Guest's SDP Answer
                setMultiplayerLoadingStatus('Waiting for guest connection', 75);
                let unAnswer = onSnapshot(roomRef, snapshot => {
                    const data = snapshot.data();
                    if (peerConnection && !peerConnection.currentRemoteDescription && data && data.answer) {
                        const answerDescription = new RTCSessionDescription(data.answer);
                        peerConnection.setRemoteDescription(answerDescription).catch(err => console.error("Host setRemoteDescription error:", err));
                    }
                });
                mpUnsubscribers.push(unAnswer);

                // HOST: Listen for Guest's ICE Candidates
                let unGuestCand = onSnapshot(collection(roomRef, 'guestCandidates'), snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const cData = change.doc.data();
                            if (cData && peerConnection) {
                                const candidate = new RTCIceCandidate(cData);
                                peerConnection.addIceCandidate(candidate).catch(err => console.error("Host addIceCandidate error:", err));
                            }
                        }
                    });
                });
                mpUnsubscribers.push(unGuestCand);

                // Host enters game world immediately while waiting for peers
                setTimeout(() => {
                    if (connectionAttempt !== multiplayerConnectionAttempt) return;
                    setMultiplayerLoadingStatus('Ready', 100);
                    hideMultiplayerLoading();
                    document.getElementById('hud').style.display = 'block';
                    document.getElementById('gameCanvas').classList.remove('hidden');
                    STATE = 'PLAYING'; updateUI(); updateHealthUI(); updateHungerUI(); updateTimeUI(); updateArmorUI(); updateHudArmorBar();
                    broadcastPlayerState(true);
                    lastAutosaveTimestamp = Date.now();
                    showToast("Hosting " + currentMpWorldName + ". Waiting for players...");
                }, 250);

            } else {
                // GUEST: Initialize WebRTC PeerConnection
                cleanUpPeerConnection();
                peerConnection = new RTCPeerConnection(rtcConfig);
                isWebRTCHost = false;

                // 1. Listen for the Host's Data Channel
                peerConnection.addEventListener('datachannel', event => {
                    gameDataChannel = event.channel;
                    setupDataChannelListeners(gameDataChannel);
                });

                // 2. Gather Guest ICE Candidates
                peerConnection.addEventListener('icecandidate', event => {
                    if (event.candidate) {
                        const candidateRef = doc(collection(roomRef, 'guestCandidates'));
                        setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Guest ICE push error", e));
                    }
                });

                // 3. Read Host Offer and Create Answer
                if (!roomData.offer) throw new Error("Host connection offer not found.");
                setMultiplayerLoadingStatus('Connecting peer handshake', 72);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(roomData.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                // 4. Send Answer back to Host
                await updateDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } });

                // 5. Listen for Host's ICE Candidates
                let unHostCand = onSnapshot(collection(roomRef, 'hostCandidates'), snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const cData = change.doc.data();
                            if (cData && peerConnection) {
                                const candidate = new RTCIceCandidate(cData);
                                peerConnection.addIceCandidate(candidate).catch(err => console.error("Guest addIceCandidate error:", err));
                            }
                        }
                    });
                });
                mpUnsubscribers.push(unHostCand);
                setMultiplayerLoadingStatus('Establishing WebRTC data channel', 88);
            }

        } catch(e) {
            console.error("Multiplayer join error", e);
            cleanUpPeerConnection();
            mpUnsubscribers.forEach(unsubscribe => unsubscribe());
            mpUnsubscribers = [];
            isMultiplayer = false;
            currentMpRoom = null;
            showMultiplayerLoadingError(e.message || "Error joining server.");
        }
    }


    export function openPublishMultiplayerModal() {
        let savedWorlds = getSavedWorlds();
        let wInfo = savedWorlds.find(w => w.id === currentWorldId);
        let worldName = wInfo?.name || "Singleplayer World";
        document.getElementById('publish-mp-world-name').value = worldName;
        document.getElementById('publish-mp-password').value = "";
        document.getElementById('publish-mp-backup-copy').checked = true;
        document.getElementById('publish-multiplayer-modal').classList.remove('hidden');
        document.getElementById('publish-mp-password').focus();
    }

    export function closePublishMultiplayerModal() {
        document.getElementById('publish-multiplayer-modal').classList.add('hidden');
    }

    export async function confirmPublishToMultiplayer() {
        let worldName = document.getElementById('publish-mp-world-name').value.trim() || "Multiplayer World";
        let password = document.getElementById('publish-mp-password').value.trim();
        let makeBackup = document.getElementById('publish-mp-backup-copy').checked;

        if (!/^\d{4,}$/.test(password)) {
            showToast("Password must contain at least 4 digits.");
            return;
        }

        closePublishMultiplayerModal();
        document.getElementById('pause-menu').classList.add('hidden');

        // 1. Save current world first so the latest snapshot is up to date
        saveCurrentWorld();

        // 2. Create a Singleplayer backup copy if requested
        if (makeBackup && currentWorldId) {
            try {
                let worlds = getSavedWorlds();
                let currentInfo = worlds.find(w => w.id === currentWorldId);
                let rawSave = localStorage.getItem('swc_data_' + currentWorldId);
                if (currentInfo && rawSave) {
                    let backupId = 'world_' + Date.now() + '_backup';
                    let backupInfo = Object.assign({}, currentInfo, {
                        id: backupId,
                        name: currentInfo.name + " (Backup)",
                        lastPlayed: Date.now()
                    });
                    worlds.push(backupInfo);
                    saveWorldsList(worlds);
                    localStorage.setItem('swc_data_' + backupId, rawSave);
                    showToast("Backup copy saved to Singleplayer worlds.");
                }
            } catch(backupErr) {
                console.error("Backup save failed", backupErr);
            }
        }

        // 3. Prepare Multiplayer Room in Firebase & WebRTC Host
        showMultiplayerLoading(worldName);
        if (!await ensureFirebase()) {
            hideMultiplayerLoading();
            showToast("Firebase connection unavailable.");
            return;
        }

        try {
            setMultiplayerLoadingStatus('Initializing multiplayer room', 20);
            let roomName = 'room_' + window.user.uid + '_' + Date.now();
            let passwordHash = await hashRoomPassword(password);
            const { doc, setDoc, collection } = window.fbModules;
            const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);

            // WebRTC Host Setup
            cleanUpPeerConnection();
            peerConnection = new RTCPeerConnection(rtcConfig);
            isWebRTCHost = true;

            gameDataChannel = peerConnection.createDataChannel('webcraft2d_sync', {
                ordered: false,
                maxRetransmits: 0
            });
            setupDataChannelListeners(gameDataChannel);

            peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    const candidateRef = doc(collection(roomRef, 'hostCandidates'));
                    setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Host ICE push error", e));
                }
            });

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Room doc with WebRTC SDP Offer
            await setDoc(roomRef, {
                worldName,
                gameMode: 'survival',
                minigameType: null,
                difficulty: currentDifficulty,
                worldSize: currentWorldSize,
                worldWidth: WORLD_WIDTH,
                worldHeight: WORLD_HEIGHT,
                starterItems: false,
                keepInventory: keepInventory,
                achievementsEnabled: currentWorldAchievementsEnabled,
                passwordHash,
                seed: (Number.isFinite(mapSeed) ? mapSeed : Math.floor(Math.random() * 100000)),
                timeOfDay,
                dayCount,
                frameCount,
                gameVersion: GAME_VERSION,
                gameBuild: GAME_BUILD,
                createdAt: Date.now(),
                ownerId: window.user.uid,
                status: 'open',
                hasCustomWorld: true,
                offer: { type: offer.type, sdp: offer.sdp }
            });

            // Custom world terrain chunks & metadata
            ensureTreeWoodNonCollidable();
            const numChunksX = Math.ceil(WORLD_WIDTH / MP_CHUNK_SIZE);
            const numChunksY = Math.ceil(WORLD_HEIGHT / MP_CHUNK_SIZE);
            const chunkDocs = [];
            for (let cx = 0; cx < numChunksX; cx++) {
                for (let cy = 0; cy < numChunksY; cy++) {
                    const startX = cx * MP_CHUNK_SIZE;
                    const startY = cy * MP_CHUNK_SIZE;
                    chunkDocs.push({
                        cx, cy,
                        rle: compressChunk(world, startX, startY, MP_CHUNK_SIZE, MP_CHUNK_SIZE),
                        bgRle: compressChunk(bgWorld, startX, startY, MP_CHUNK_SIZE, MP_CHUNK_SIZE)
                    });
                }
            }

            const CHUNK_BATCH_SIZE = 20;
            for (let i = 0; i < chunkDocs.length; i += CHUNK_BATCH_SIZE) {
                const batch = chunkDocs.slice(i, i + CHUNK_BATCH_SIZE);
                const progress = 25 + Math.round((i / chunkDocs.length) * 20);
                setMultiplayerLoadingStatus(`Uploading terrain chunks (${Math.min(i + CHUNK_BATCH_SIZE, chunkDocs.length)}/${chunkDocs.length})`, progress);
                await Promise.all(batch.map(c => 
                    setDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'world_chunks_' + roomName, `${c.cx}_${c.cy}`), c)
                ));
            }

            setMultiplayerLoadingStatus('Saving world metadata', 48);
            await setDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_custom_worlds', roomName), {
                isChunked: true,
                chunkSize: MP_CHUNK_SIZE,
                numChunksX,
                numChunksY,
                worldWidth: WORLD_WIDTH,
                worldHeight: WORLD_HEIGHT,
                nonCollidableTreeWood: [...nonCollidableTreeWood],
                saplingGrowthQueue: Object.fromEntries(saplingGrowthQueue),
                cropGrowthQueue: Object.fromEntries(cropGrowthQueue),
                furnaces: furnaces,
                timestamp: Date.now()
            });

            // Connect and transition smoothly to multiplayer as Host
            await connectToMultiplayerRoom(roomName, passwordHash, true, true /* isHost */);
        } catch(err) {
            console.error("Publish to multiplayer failed", err);
            cleanUpPeerConnection();
            hideMultiplayerLoading();
            showToast("Failed to publish world: " + (err.message || "Network error"));
        }
    }
    

// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof app !== "undefined") window.app = app; } catch(e) {}
try { if (typeof appId !== "undefined") window.appId = appId; } catch(e) {}
try { if (typeof applyMultiplayerBlockDiff !== "undefined") window.applyMultiplayerBlockDiff = applyMultiplayerBlockDiff; } catch(e) {}
try { if (typeof applyMultiplayerWorldState !== "undefined") window.applyMultiplayerWorldState = applyMultiplayerWorldState; } catch(e) {}
try { if (typeof broadcastDataPacket !== "undefined") window.broadcastDataPacket = broadcastDataPacket; } catch(e) {}
try { if (typeof broadcastPlayerState !== "undefined") window.broadcastPlayerState = broadcastPlayerState; } catch(e) {}
try { if (typeof cancelMultiplayerConnection !== "undefined") window.cancelMultiplayerConnection = cancelMultiplayerConnection; } catch(e) {}
try { if (typeof cleanUpPeerConnection !== "undefined") window.cleanUpPeerConnection = cleanUpPeerConnection; } catch(e) {}
try { if (typeof closeMultiplayerMenu !== "undefined") window.closeMultiplayerMenu = closeMultiplayerMenu; } catch(e) {}
try { if (typeof closePublishMultiplayerModal !== "undefined") window.closePublishMultiplayerModal = closePublishMultiplayerModal; } catch(e) {}
try { if (typeof closeRoomDialogs !== "undefined") window.closeRoomDialogs = closeRoomDialogs; } catch(e) {}
try { if (typeof confirmPublishToMultiplayer !== "undefined") window.confirmPublishToMultiplayer = confirmPublishToMultiplayer; } catch(e) {}
try { if (typeof connectToMultiplayerRoom !== "undefined") window.connectToMultiplayerRoom = connectToMultiplayerRoom; } catch(e) {}
try { if (typeof createMultiplayerRoom !== "undefined") window.createMultiplayerRoom = createMultiplayerRoom; } catch(e) {}
try { if (typeof currentAutosaveBroadcastId !== "undefined") window.currentAutosaveBroadcastId = currentAutosaveBroadcastId; } catch(e) {}
try { if (typeof damageRemotePlayer !== "undefined") window.damageRemotePlayer = damageRemotePlayer; } catch(e) {}
try { if (typeof deserializeDroppedItem !== "undefined") window.deserializeDroppedItem = deserializeDroppedItem; } catch(e) {}
try { if (typeof deserializeMultiplayerEntity !== "undefined") window.deserializeMultiplayerEntity = deserializeMultiplayerEntity; } catch(e) {}
try { if (typeof dropItemForWorld !== "undefined") window.dropItemForWorld = dropItemForWorld; } catch(e) {}
try { if (typeof ensureFirebase !== "undefined") window.ensureFirebase = ensureFirebase; } catch(e) {}
try { if (typeof fbSignInWithCustomToken !== "undefined") window.fbSignInWithCustomToken = fbSignInWithCustomToken; } catch(e) {}
try { if (typeof firebaseConfig !== "undefined") window.firebaseConfig = firebaseConfig; } catch(e) {}
try { if (typeof gameDataChannel !== "undefined") window.gameDataChannel = gameDataChannel; } catch(e) {}
try { if (typeof hashRoomPassword !== "undefined") window.hashRoomPassword = hashRoomPassword; } catch(e) {}
try { if (typeof hideMultiplayerLoading !== "undefined") window.hideMultiplayerLoading = hideMultiplayerLoading; } catch(e) {}
try { if (typeof hideSingleplayerLoading !== "undefined") window.hideSingleplayerLoading = hideSingleplayerLoading; } catch(e) {}
try { if (typeof initFirebaseSdk !== "undefined") window.initFirebaseSdk = initFirebaseSdk; } catch(e) {}
try { if (typeof isMultiplayerAuthority !== "undefined") window.isMultiplayerAuthority = isMultiplayerAuthority; } catch(e) {}
try { if (typeof isWebRTCHost !== "undefined") window.isWebRTCHost = isWebRTCHost; } catch(e) {}
try { if (typeof joinSelectedRoom !== "undefined") window.joinSelectedRoom = joinSelectedRoom; } catch(e) {}
try { if (typeof lastFluidSyncTime !== "undefined") window.lastFluidSyncTime = lastFluidSyncTime; } catch(e) {}
try { if (typeof lastMultiplayerConnection !== "undefined") window.lastMultiplayerConnection = lastMultiplayerConnection; } catch(e) {}
try { if (typeof lastReceivedAutosaveId !== "undefined") window.lastReceivedAutosaveId = lastReceivedAutosaveId; } catch(e) {}
try { if (typeof lastSentLocalPlayerPos !== "undefined") window.lastSentLocalPlayerPos = lastSentLocalPlayerPos; } catch(e) {}
try { if (typeof loadAvailableRooms !== "undefined") window.loadAvailableRooms = loadAvailableRooms; } catch(e) {}
try { if (typeof mpCurrentFilter !== "undefined") window.mpCurrentFilter = mpCurrentFilter; } catch(e) {}
try { if (typeof mpCurrentGameMode !== "undefined") window.mpCurrentGameMode = mpCurrentGameMode; } catch(e) {}
try { if (typeof mpUnsubscribers !== "undefined") window.mpUnsubscribers = mpUnsubscribers; } catch(e) {}
try { if (typeof multiplayerConnectionAttempt !== "undefined") window.multiplayerConnectionAttempt = multiplayerConnectionAttempt; } catch(e) {}
try { if (typeof openMultiplayerMenu !== "undefined") window.openMultiplayerMenu = openMultiplayerMenu; } catch(e) {}
try { if (typeof openPublishMultiplayerModal !== "undefined") window.openPublishMultiplayerModal = openPublishMultiplayerModal; } catch(e) {}
try { if (typeof peerConnection !== "undefined") window.peerConnection = peerConnection; } catch(e) {}
try { if (typeof pendingDropRequest !== "undefined") window.pendingDropRequest = pendingDropRequest; } catch(e) {}
try { if (typeof processRemoteDropRequests !== "undefined") window.processRemoteDropRequests = processRemoteDropRequests; } catch(e) {}
try { if (typeof processRemotePickupRequests !== "undefined") window.processRemotePickupRequests = processRemotePickupRequests; } catch(e) {}
try { if (typeof resetMultiplayerLoadingScreen !== "undefined") window.resetMultiplayerLoadingScreen = resetMultiplayerLoadingScreen; } catch(e) {}
try { if (typeof retryMultiplayerConnection !== "undefined") window.retryMultiplayerConnection = retryMultiplayerConnection; } catch(e) {}
try { if (typeof rtcConfig !== "undefined") window.rtcConfig = rtcConfig; } catch(e) {}
try { if (typeof selectMpDifficulty !== "undefined") window.selectMpDifficulty = selectMpDifficulty; } catch(e) {}
try { if (typeof selectMpGameMode !== "undefined") window.selectMpGameMode = selectMpGameMode; } catch(e) {}
try { if (typeof serializeDroppedItem !== "undefined") window.serializeDroppedItem = serializeDroppedItem; } catch(e) {}
try { if (typeof serializeMultiplayerEntity !== "undefined") window.serializeMultiplayerEntity = serializeMultiplayerEntity; } catch(e) {}
try { if (typeof setMpFilter !== "undefined") window.setMpFilter = setMpFilter; } catch(e) {}
try { if (typeof setMultiplayerLoadingStatus !== "undefined") window.setMultiplayerLoadingStatus = setMultiplayerLoadingStatus; } catch(e) {}
try { if (typeof setupDataChannelListeners !== "undefined") window.setupDataChannelListeners = setupDataChannelListeners; } catch(e) {}
try { if (typeof showMultiplayerLoading !== "undefined") window.showMultiplayerLoading = showMultiplayerLoading; } catch(e) {}
try { if (typeof showMultiplayerLoadingError !== "undefined") window.showMultiplayerLoadingError = showMultiplayerLoadingError; } catch(e) {}
try { if (typeof showSingleplayerLoading !== "undefined") window.showSingleplayerLoading = showSingleplayerLoading; } catch(e) {}
try { if (typeof spawnDroppedItem !== "undefined") window.spawnDroppedItem = spawnDroppedItem; } catch(e) {}
try { if (typeof switchMpTab !== "undefined") window.switchMpTab = switchMpTab; } catch(e) {}
try { if (typeof syncBlock !== "undefined") window.syncBlock = syncBlock; } catch(e) {}
try { if (typeof syncFluidState !== "undefined") window.syncFluidState = syncFluidState; } catch(e) {}
try { if (typeof syncLocalPlayerState !== "undefined") window.syncLocalPlayerState = syncLocalPlayerState; } catch(e) {}
try { if (typeof syncMultiplayerWorldState !== "undefined") window.syncMultiplayerWorldState = syncMultiplayerWorldState; } catch(e) {}
try { if (typeof tryCompleteMultiplayerSleep !== "undefined") window.tryCompleteMultiplayerSleep = tryCompleteMultiplayerSleep; } catch(e) {}
try { if (typeof registerWebcraftAccount !== "undefined") window.registerWebcraftAccount = registerWebcraftAccount; } catch(e) {}
try { if (typeof loginWebcraftAccount !== "undefined") window.loginWebcraftAccount = loginWebcraftAccount; } catch(e) {}
try { if (typeof loginAsGuest !== "undefined") window.loginAsGuest = loginAsGuest; } catch(e) {}
try { if (typeof logoutWebcraftAccount !== "undefined") window.logoutWebcraftAccount = logoutWebcraftAccount; } catch(e) {}
try { if (typeof saveUserProfileToCloud !== "undefined") window.saveUserProfileToCloud = saveUserProfileToCloud; } catch(e) {}
try { if (typeof getUserProfileFromCloud !== "undefined") window.getUserProfileFromCloud = getUserProfileFromCloud; } catch(e) {}
try { if (typeof normalizeWebcraftTag !== "undefined") window.normalizeWebcraftTag = normalizeWebcraftTag; } catch(e) {}
try { if (typeof formatWebcraftTag !== "undefined") window.formatWebcraftTag = formatWebcraftTag; } catch(e) {}
try { if (typeof validateWebcraftTag !== "undefined") window.validateWebcraftTag = validateWebcraftTag; } catch(e) {}
try { if (typeof hashPassword !== "undefined") window.hashPassword = hashPassword; } catch(e) {}
try { if (typeof addFriendByTag !== "undefined") window.addFriendByTag = addFriendByTag; } catch(e) {}
try { if (typeof sendFriendRequestByTag !== "undefined") window.sendFriendRequestByTag = sendFriendRequestByTag; } catch(e) {}
try { if (typeof fetchIncomingFriendRequests !== "undefined") window.fetchIncomingFriendRequests = fetchIncomingFriendRequests; } catch(e) {}
try { if (typeof acceptFriendRequestByTag !== "undefined") window.acceptFriendRequestByTag = acceptFriendRequestByTag; } catch(e) {}
try { if (typeof declineFriendRequestByTag !== "undefined") window.declineFriendRequestByTag = declineFriendRequestByTag; } catch(e) {}
try { if (typeof removeFriendByTag !== "undefined") window.removeFriendByTag = removeFriendByTag; } catch(e) {}
try { if (typeof fetchFriendsProfiles !== "undefined") window.fetchFriendsProfiles = fetchFriendsProfiles; } catch(e) {}
try { if (typeof startPresenceHeartbeat !== "undefined") window.startPresenceHeartbeat = startPresenceHeartbeat; } catch(e) {}
try { if (typeof stopPresenceHeartbeat !== "undefined") window.stopPresenceHeartbeat = stopPresenceHeartbeat; } catch(e) {}
try { if (typeof cropGrowthQueue !== "undefined") window.cropGrowthQueue = cropGrowthQueue; } catch(e) {}
try { if (typeof pureJsSha256 !== "undefined") window.pureJsSha256 = pureJsSha256; } catch(e) {}
try { if (typeof hashStringSHA256 !== "undefined") window.hashStringSHA256 = hashStringSHA256; } catch(e) {}
try { if (typeof DEFAULT_BETA_PASSWORD_HASH !== "undefined") window.DEFAULT_BETA_PASSWORD_HASH = DEFAULT_BETA_PASSWORD_HASH; } catch(e) {}
try { if (typeof CLOSED_BETA_LOCALSTORAGE_KEY !== "undefined") window.CLOSED_BETA_LOCALSTORAGE_KEY = CLOSED_BETA_LOCALSTORAGE_KEY; } catch(e) {}
try { if (typeof fetchClosedBetaConfig !== "undefined") window.fetchClosedBetaConfig = fetchClosedBetaConfig; } catch(e) {}
try { if (typeof setClosedBetaLockState !== "undefined") window.setClosedBetaLockState = setClosedBetaLockState; } catch(e) {}


