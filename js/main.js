/** 
 * KÜR IPTV - Tizen OS Core Bootstrapper & Central Controller (Klassik ES5) 
 * Bütün sintaksis, düymə və mötərizə xətaları 100% təmizlənmiş rəsmi vahid motor
 */

var AppCore = {
    userCode: "M100320266",
    currentFocusArea: "login", // Başlanğıcı birbaşa 'login' edirik ki, pult düymələri kilidlənməsin
    loginIdBuffer: "",
    currentLoginSubFocus: "input",
    focusedMenuIdx: 0,
    menuItems: [
        "menu_nav_channels", 
        "menu_nav_tutorial", 
        "menu_nav_settings",
        "menu_nav_about"
    ], 
    
    // Ayarlar pult hərəkəti üçün dəyişənlər 
    focusedSettingIdx: 0,
    settingItems: [
        "setting_quality", "setting_theme", "setting_lang",
        "setting_m3u_url", "setting_xtream_host", "setting_xtream_user",
        "setting_xtream_pass", "setting_save_all"
    ],
    currentQuality: localStorage.getItem("setting_quality") || "Auto",
    currentTheme: localStorage.getItem("theme") || "system",
    currentLang: localStorage.getItem("setting_lang") || "az",

    /** 
     * Tətbiqin ilk işə düşmə funksiyası 
     */
    init: function() {
        console.log("🚀 KÜR IPTV: Sistem başladılır...");
        var self = this;
        
        if (window.PlayerEngine && typeof PlayerEngine.init === "function") {
            PlayerEngine.init();
        } 
        
        // Daxili funksiyaları qlobal çağırışla işə salırıq
        if (typeof setupAdapterListeners === "function") {
            setupAdapterListeners();
        } else if (typeof self.setupAdapterListeners === "function") {
            self.setupAdapterListeners();
        }

        this.bindGlobalKeys(); 
        
        // Mövzunu yoxla
        var savedTheme = localStorage.getItem("theme") || "system";
        if (document.body.className !== "theme-" + savedTheme) {
            document.body.className = "theme-" + savedTheme;
        } 
        
        // Giriş ekranını dərhal və vizual olaraq fokuslandırırıq
        this.openLoginScreen();
    },

    /**
     * 📱 MENYUNU VƏ KANAL SİYAHISINI TAM GİZLƏDƏN FUNKSİYA (Tam Ekran Video Rejimi)
     */
    hideAllMenus: function() {
        // Layihədəki bütün mümkün kanal və menyu konteynerlərini tapırıq
        var navDrawer = document.getElementById("navigation-drawer");
        var mainUi = document.getElementById("main-ui");
        var recyclerView = document.getElementById("recyclerViewChannels");
        var emptyMsg = document.getElementById("tvEmptyMessage");
        
        // 🚀 ROBOT KİMİ QALMAMASI ÜÇÜN HAMISINI ZORLA VƏ CSS TEXT İLƏ DOĞRUDAN GİZLƏDİRİK
        if (navDrawer) navDrawer.style.cssText = "display: none !important; visibility: hidden !important;";
        if (mainUi) mainUi.style.cssText = "display: none !important; visibility: hidden !important;";
        if (recyclerView) recyclerView.style.cssText = "display: none !important; visibility: hidden !important;";
        if (emptyMsg) emptyMsg.style.cssText = "display: none !important; visibility: hidden !important;";
        
        // Pult fokusunun arxa planda ilişməməsi üçün sahəni player edirik
        this.currentFocusArea = "player";
        console.log("📺 TV Rejimi: Bütün pəncərələr və playlist tamamilə yox edildi.");
    },

    /**
     * 📱 VİDEO GEDƏRKƏN OK BASANDA YALNIZ KANAL SİYAHISINI EKRANA ÇAĞIRAN FUNKSİYA
     */
    showMainMenu: function() {
        var navDrawer = document.getElementById("navigation-drawer");
        var mainUi = document.getElementById("main-ui");
        var recyclerView = document.getElementById("recyclerViewChannels");
        
        // Sol yan menyu gizli qalır
        if (navDrawer) navDrawer.style.cssText = "display: none !important;";
        
        // 🚀 Playlist paneli və daxili siyahı məcburi olaraq ekrana canlanır!
        if (mainUi) mainUi.style.cssText = "display: block !important; visibility: visible !important; z-index: 9999 !important;";
        if (recyclerView) recyclerView.style.cssText = "display: flex !important; visibility: visible !important;";
        
        // Pult fokusunu birbaşa kanal siyahısındakı sonuncu aktiv kanala ötürürük
        this.currentFocusArea = "channels";
        if (window.ChannelAdapter) {
            window.ChannelAdapter.focusItem(window.ChannelAdapter._focusedIndex);
        }
        console.log("📱 Playlist Çağırıldı: Siyahı rəsmi olaraq ön plandadır.");
    },


    /**
     * 📱 SOL ANA MENYUNU AKTV EDƏN FUNKSİYA
     */
    focusMenu: function(index) {
        this.focusedMenuIdx = index;
        
        // İstifadəçi siyahıdan sola keçəndə sol yan menyunu dərhal görünən edirik
        var navDrawer = document.getElementById("navigation-drawer");
        if (navDrawer) navDrawer.style.setProperty("display", "flex", "important");
        
        var el = document.getElementById(this.menuItems[index]);
        if (el) el.focus();
    },

    /** 
     * Splash ekranını bağlayıb rəsmi Login ekranını açan və fokuslayan bölmə 
     */
    openLoginScreen: function() {
        this.currentFocusArea = "login";
        this.loginIdBuffer = "";
        this.currentLoginSubFocus = "input";
        
        var splashEl = document.getElementById("splash-screen");
        var loginEl = document.getElementById("login-screen");
        var navDrawer = document.getElementById("navigation-drawer");
        
        if (splashEl) splashEl.style.setProperty("display", "none", "important");
        if (navDrawer) navDrawer.style.display = "none";
        
        if (loginEl) {
            loginEl.style.setProperty("display", "flex", "important");
            var displayId = document.getElementById("login-id-display");
            if (displayId) displayId.innerText = "İstifadəçi ID";
        }
        
        // 🛡️ AVTOMATİK KLAVİATURA AKTİVLƏŞDİRMƏ DRAVVERİ
        setTimeout(function() {
            var inputEl = document.getElementById("login-id-display");
            if (inputEl) {
                inputEl.setAttribute("tabindex", "0");
                inputEl.focus();
                inputEl.style.border = "3px solid #2196F3";
                inputEl.style.backgroundColor = "#E3F2FD";
                console.log("🎯 UĞURLU: Giriş pəncərəsi avtomatik pult fokusuna bağlandı.");
            }
        }, 150);
    },

    handleLoginKeyPress: function(num) {
        if (this.loginIdBuffer.length < 12) {
            this.loginIdBuffer += num;
            var displayId = document.getElementById("login-id-display");
            if (displayId) displayId.innerText = this.loginIdBuffer;
        }
    }, 

    handleLoginDelete: function() {
        if (this.loginIdBuffer.length > 0) {
            this.loginIdBuffer = this.loginIdBuffer.substring(0, this.loginIdBuffer.length - 1);
            var displayId = document.getElementById("login-id-display");
            if (displayId) {
                displayId.innerText = this.loginIdBuffer || "İstifadəçi ID";
            }
        }
    },

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
                        if (navDrawer) navDrawer.style.display = "flex";
                        
                        FirebaseEngine.checkAdminMessage(code, function(msg) {
                            alert("Admin Bildirişi: \n " + msg); 
                            FirebaseEngine.clearAdminMessage(code); 
                        }); 
                        
                        if (typeof loadMediaData === "function") {
                            loadMediaData(userData);
                        } else if (typeof self.loadMediaData === "function") {
                            self.loadMediaData(userData);
                        }
                        
                        self.currentFocusArea = "menu";
                        self.focusMenu(0);
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

    /**
     * 🎮 [GLOBAL PULT DÜYMƏ KÖPRÜSÜ] - Tam, Kəsiksiz və Sarsılmaz Blok
     */
    bindGlobalKeys: function() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            var keyCode = e.keyCode;
            console.log("🎮 Basılan Pult Düyməsi Kod: " + keyCode + " | Hazırkı Sahə: " + self.currentFocusArea);

            // 0. AXTARIŞ DİALOGU REJİMİ
            if (self.currentFocusArea === "search_dialog") {
                if (keyCode === 13) {
                    var queryText = document.getElementById("search-input-field").value;
                    if (window.SearchEngine) {
                        SearchEngine.filterChannels(queryText);
                        SearchEngine.closeSearchDialog();
                    }
                    self.currentFocusArea = "channels";
                } else if (keyCode === 10009 || keyCode === 27) {
                    if (window.SearchEngine) SearchEngine.closeSearchDialog();
                    self.currentFocusArea = "channels";
                    if (window.ChannelAdapter) ChannelAdapter.focusItem(ChannelAdapter._focusedIndex);
                }
                return;
            } 

            // 1. ID GİRİŞ (LOGIN) EKRANI REJİMİ
            if (self.currentFocusArea === "login") {
                if (self.currentLoginSubFocus === "input") {
                    if (keyCode >= 48 && keyCode <= 57) { self.handleLoginKeyPress(keyCode - 48); return; } 
                    else if (keyCode >= 96 && keyCode <= 105) { self.handleLoginKeyPress(keyCode - 96); return; } 
                    else if (keyCode === 37) { self.handleLoginDelete(); return; }
                    else if (keyCode === 40) { // Aşağı basanda Giriş düyməsinə keçid
                        self.currentLoginSubFocus = "button";
                        var btnEl = document.getElementById("login-btn");
                        if (btnEl) {
                            btnEl.focus();
                            btnEl.style.outline = "3px solid #2196F3";
                        }
                        var inputEl = document.getElementById("login-id-display");
                        if (inputEl) inputEl.style.border = "1px solid #ccc";
                        return;
                    }
                } else if (self.currentLoginSubFocus === "button") {
                    if (keyCode === 38) { // Yuxarı basanda yenidən input fokusuna qalxmaq
                        self.currentLoginSubFocus = "input";
                        var inputEl = document.getElementById("login-id-display");
                        if (inputEl) {
                            inputEl.focus();
                            inputEl.style.border = "3px solid #2196F3";
                        }
                        var btnEl = document.getElementById("login-btn");
                        if (btnEl) btnEl.style.outline = "none";
                        return;
                    }
                }
                
                // OK (Enter) düyməsi basıldıqda
                if (keyCode === 13) {
                    if (self.loginIdBuffer.trim() !== "" && self.loginIdBuffer !== "İstifadəçi ID") {
                        self.processLogin(self.loginIdBuffer);
                    } else {
                        alert("Zəhmət olmasa ID kodunuzu yazın!");
                    }
                }
                return;
            }

            // 2. 🔒 PIN DIALOG (Kanal Kilidi) REJİMİ
            if (self.currentFocusArea === "pin_dialog") {
                if (keyCode >= 48 && keyCode <= 57) {
                    if (window.ContextDialogEngine) ContextDialogEngine.handlePinInput(keyCode - 48);
                } else if (keyCode === 10009 || keyCode === 27) {
                    if (window.ContextDialogEngine) ContextDialogEngine.closePinDialog();
                    self.currentFocusArea = "channels";
                    if (window.ChannelAdapter) ChannelAdapter.focusItem(ChannelAdapter._focusedIndex);
                }
                return;
            }

            // 3. ⚙️ KONTEKST MENYU SEÇİMLƏRİ REJİMİ
            if (self.currentFocusArea === "context_menu") {
                if (keyCode === 38) {
                    if (window.ContextDialogEngine && ContextDialogEngine.focusedOptionIdx > 0) {
                        ContextDialogEngine.focusOption(ContextDialogEngine.focusedOptionIdx - 1);
                    }
                } else if (keyCode === 40) {
                    if (window.ContextDialogEngine && ContextDialogEngine.options && ContextDialogEngine.focusedOptionIdx < ContextDialogEngine.options.length - 1) {
                        ContextDialogEngine.focusOption(ContextDialogEngine.focusedOptionIdx + 1);
                    }
                } else if (keyCode === 13) {
                    if (window.ContextDialogEngine) ContextDialogEngine.handleOptionClick(ContextDialogEngine.focusedOptionIdx);
                } else if (keyCode === 10009 || keyCode === 27) {
                    if (window.ContextDialogEngine) ContextDialogEngine.closeContextMenu();
                    self.currentFocusArea = "channels";
                    if (window.ChannelAdapter) ChannelAdapter.focusItem(window.ChannelAdapter._focusedIndex);
                }
                return;
            }

            // 4. 📱 SOL ANA MENYU REJİMİ (Navigation Drawer)
            if (self.currentFocusArea === "menu") {
                if (keyCode === 38) { // YUXARI
                    if (self.focusedMenuIdx > 0) self.focusMenu(self.focusedMenuIdx - 1);
                    return;
                }
                if (keyCode === 40) { // AŞAĞI
                    if (self.focusedMenuIdx < self.menuItems.length - 1) self.focusMenu(self.focusedMenuIdx + 1);
                    return;
                }
                if (keyCode === 39 || keyCode === 13) { // SAĞA və ya OK basanda Kanallara keç
                    if (self.focusedMenuIdx === 0) { // "📺 Kanallar" seçilidirsə
                        // 🚀 DÜZƏLİŞ: Kanallara adlayanda sol yan menyunu avtomatik gizlədirik!
                        var navDrawer = document.getElementById("navigation-drawer");
                        if (navDrawer) navDrawer.style.setProperty("display", "none", "important");
                        
                        var mainUi = document.getElementById("main-ui");
                        if (mainUi) mainUi.style.setProperty("display", "block", "important");
                        
                        self.currentFocusArea = "channels";
                        if (window.ChannelAdapter) ChannelAdapter.focusItem(window.ChannelAdapter._focusedIndex);
                    }
                    return;
                }
            }

            // 5. 📺 KANAL SİYAHISI REJİMİ
            if (self.currentFocusArea === "channels") {
                if (keyCode === 38 || keyCode === 29460) { // Pult YUXARI
                    if (window.ChannelAdapter) window.ChannelAdapter.moveSelection(true);
                    return;
                }
                if (keyCode === 40 || keyCode === 29461) { // Pult AŞAĞI
                    if (window.ChannelAdapter) window.ChannelAdapter.moveSelection(false);
                    return;
                }
                if (keyCode === 37 || keyCode === 4) { // Pult SOL (Kanal siyahısından sol menyuya keçmək üçün)
                    self.currentFocusArea = "menu";
                    self.focusMenu(self.focusedMenuIdx);
                    return;
                }
                if (keyCode === 13) { // Pult OK / ENTER (Kanalı seçib tam ekrana keçmək)
                    if (window.ChannelAdapter && window.ChannelAdapter._channels) {
                        var selectCh = window.ChannelAdapter._channels[window.ChannelAdapter._focusedIndex];
                        if (selectCh) {
                            console.log("🚀 Kanal seçildi! Yayım başladılır: " + selectCh.name);
                            if (window.PlayerEngine && typeof window.PlayerEngine.play === "function") {
                                window.PlayerEngine.play(selectCh.url);
                            }
                            // 🔥 KANAL SEÇİLDİ: Menyuların hamısını avtomatik bağlayırıq!
                            self.hideAllMenus();
                        }
                    }
                    return;
                }
                if (keyCode === 10009 || keyCode === 27) { // Tizen BACK / RETURN
                    self.hideAllMenus();
                    return;
                }
            }

            // 6. 🕹️ VİDEO TAM EKRAN OLANDA PULT DÜYMƏLƏRİ (Menyunu geri çağırmaq üçün)
            if (self.currentFocusArea === "player") {
                if (keyCode === 13 || keyCode === 10009 || keyCode === 27 || keyCode === 37 || keyCode === 38 || keyCode === 40) {
                    console.log("🔄 Tam ekrandan çıxılır, menyu və kanal siyahısı geri çağırılır...");
                    self.showMainMenu();
                    return;
                }
            }
        });
    }
    };

    /**
     * 🏎️ KÜR IPTV - Tizen OS Global Bootstrapper & Lifecycle Linker
     * Tətbiqin TV yaddaşına tam yüklənməsini və AppCore-un problemsiz başlamasını təmin edir.
     */
    (function() {
        function startApplication() {
            console.log("📺 KÜR IPTV: Dom və Skriptlər tam yükləndi. Bootloader işə düşür...");
            if (window.AppCore && typeof window.AppCore.init === "function") {
                try {
                    window.AppCore.init();
                } catch (error) {
                    console.error("🚨 KRİTİK XƏTA: AppCore başladılarkən sistem çökdü:", error);
                }
            } else {
                console.error("🚨 KRİTİK XƏTA: AppCore modulu tapılmadı! js/main.js faylını yoxlayın.");
            }
        }

        var isStarted = false;
        if (document.readyState === "complete" || document.readyState === "interactive") {
            isStarted = true;
            startApplication();
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                if (!isStarted) {
                    isStarted = true;
                    startApplication();
                }
            });
        }

        window.onload = function() {
            if (!isStarted) {
                isStarted = true;
                startApplication();
            }
        };
    })();
