(function () {
  const DEFAULT_CONFIG = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '0000000000',
    appId: '1:0000000000:web:0000000000000000'
  };

  const config = window.__OSOOL_FIREBASE_CONFIG__ || DEFAULT_CONFIG;
  const isPlaceholder = !config.projectId || config.projectId === 'your-project-id';

  const manager = {
    app: null,
    db: null,
    auth: null,
    storage: null,
    ready: false,
    isConfigured: false
  };

    function normalizeUser(user) {
      if (!user) return null;
      return {
        id: user.id || user.uid || 'anonymous-user',
        name: user.name || 'مستخدم',
        phone: user.phone || '',
        currency: user.currency || 'EGP',
        nominee: user.nominee || 'الوكيل المعتمد',
        accountNo: user.accountNo || Math.floor(1000 + Math.random() * 9000),
        joinedAt: user.joinedAt || new Date().toLocaleDateString('ar-EG'),
        role: user.role || 'user',
        cashBalance: Number(user.cashBalance || 0),
        goldGrams: Number(user.goldGrams || 0),
        goldPrice24: Number(user.goldPrice24 || 4120)
      };
    }

    function initFirebase() {
      if (!window.firebase || isPlaceholder) {
        return false;
      }

      try {
        if (!firebase.apps || !firebase.apps.length) {
          manager.app = firebase.initializeApp(config);
        } else {
          manager.app = firebase.apps[0];
        }

        manager.db = firebase.firestore();
        manager.auth = firebase.auth();
        manager.storage = firebase.storage();
        manager.ready = true;
        manager.isConfigured = true;
        return true;
      } catch (error) {
        console.warn('Firebase init skipped:', error);
        manager.ready = false;
        manager.isConfigured = false;
        return false;
      }
    }

    async function setUserProfile(user) {
      const safeUser = normalizeUser(user);
      if (!manager.ready || !manager.db || !safeUser) return false;

      try {
        await manager.db.collection('users').doc(safeUser.id).set({
          ...safeUser,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
      } catch (error) {
        console.warn('Failed to sync user to Firestore:', error);
        return false;
      }
    }

    async function getUserProfile(userId) {
      if (!manager.ready || !manager.db || !userId) return null;
      try {
        const snapshot = await manager.db.collection('users').doc(userId).get();
        return snapshot.exists ? snapshot.data() : null;
      } catch (error) {
        console.warn('Failed to get user profile from Firestore:', error);
        return null;
      }
    }

    async function saveWalletRequest(request) {
      if (!manager.ready || !manager.db || !request) return false;
      try {
        await manager.db.collection('wallet_requests').doc(request.id).set({
          ...request,
          createdAt: request.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
      } catch (error) {
        console.warn('Failed to save wallet request to Firestore:', error);
        return false;
      }
    }

    async function fetchWalletQueue() {
      if (!manager.ready || !manager.db) return [];
      try {
        const snapshot = await manager.db.collection('wallet_requests').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.warn('Failed to fetch wallet queue from Firestore:', error);
        return [];
      }
    }

    async function updateWalletRequest(id, updates) {
      if (!manager.ready || !manager.db || !id) return false;
      try {
        await manager.db.collection('wallet_requests').doc(id).set({
          ...updates,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
      } catch (error) {
        console.warn('Failed to update wallet request in Firestore:', error);
        return false;
      }
    }

    manager.init = initFirebase;
    manager.normalizeUser = normalizeUser;
    manager.setUserProfile = setUserProfile;
    manager.getUserProfile = getUserProfile;
    manager.saveWalletRequest = saveWalletRequest;
    manager.fetchWalletQueue = fetchWalletQueue;
    manager.updateWalletRequest = updateWalletRequest;
    manager.init();

    window.OSOOL_FIREBASE = manager;
  })();
