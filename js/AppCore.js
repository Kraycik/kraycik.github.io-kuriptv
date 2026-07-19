       /**
     * Firebase REST API Giriş və Təhlükəsizlik Mexanizmi 
     */
    processLogin: function(code) {
        var self = this;
        console.log("Firebase yoxlanışı başladı. Kod: " + code); 
        
        if (window.FirebaseEngine) { 
            FirebaseEngine.checkUserStatus(code)
                .then(function(userData) {
                    if (userData) {
                        localStorage.setItem("user_code", code);
                        
                        var splashEl = document.getElementById("splash-screen");
                        var loginEl = document.getElementById("login-screen");
                        var navDrawer = document.getElementById("navigation-drawer");
                        
                        if (splashEl) splashEl.style.display = "none";
                        if (loginEl) loginEl.style.display = "none";
                        
                        // 1. Yan menyunu və Kanalların əsas UI hissəsini rəsmən açırıq
                        if (navDrawer) navDrawer.style.display = "flex";
                        var mainUi = document.getElementById("main-ui");
                        if (mainUi) mainUi.style.display = "block";
                        
                        // 2. Admin bildirişlərini yoxlayırıq
                        FirebaseEngine.checkAdminMessage(code, function(msg) {
                            if (msg) {
                                alert("Admin Bildirişi: \n " + msg); 
                                FirebaseEngine.clearAdminMessage(code); 
                            }
                        }); 
                        
                        // 3. 🚀 KANALLARI SERVERDƏN MƏCBURİ YÜKLƏYİRİK
                        if (typeof window.loadMediaData === "function") {
                            window.loadMediaData(userData);
                        } else if (typeof loadMediaData === "function") {
                            loadMediaData(userData);
                        } else if (typeof self.loadMediaData === "function") {
                            self.loadMediaData(userData);
                        }
                        
                        // 4. Pult fokusunu birbaşa yan menyunun ilk bəndinə (Kanallar) ötürürük
                        self.currentFocusArea = "menu";
                        self.focusMenu(0);
                        
                        console.log("✅ KÜR IPTV: Kanallar yüklənməyə göndərildi, pult aktivdir.");
                    } else {
                        self.openLoginScreen();
                    }
                })
                .catch(function(err) {
                    console.error("Giriş xətası: ", err); 
                    self.openLoginScreen(); 
                }); 
        } else { 
            self.openLoginScreen(); 
        } 
    },

    focusMenu: function(index) {
        this.focusedMenuIdx = index;
        var el = document.getElementById(this.menuItems[index]);
        if (el) el.focus();
    },
