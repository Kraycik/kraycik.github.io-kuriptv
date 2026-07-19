/**
 * KÜR IPTV - Tizen OS Core Bootstrapper (Klassik ES5)
 * Splash donma xətası 100% aradan qaldırılmış rəsmi ana mərkəz 
 */
var AppCore = {
    currentFocusArea: "splash", // splash, login, menu, channels, context_menu, pin_dialog
    loginIdBuffer: "",
    currentLoginSubFocus: "input",
    focusedMenuIdx: 0,
    menuItems: ["menu_nav_channels", "menu_nav_tutorial", "menu_nav_settings", "menu_nav_about"],

    /**
     * Tətbiqin ilk işə düşmə funksiyası (Android SplashActivity 100% Qarşılığı) 
     */
    init: function() {
        console.log("🚀 KÜR IPTV: Təmiz səhifədən mühərrik başladılır...");
        var self = this;
        
        if (window.PlayerEngine && typeof PlayerEngine.init === "function") {
            PlayerEngine.init();
        }
        
        this.setupAdapterListeners();
        this.bindGlobalKeys();

        // 2 saniyəlik Splash (Loqo) gözləmə taymeri
        setTimeout(function() {
            try {
                var savedCode = localStorage.getItem("user_code");
                // Əgər yaddaş tam təmizdirsə və kod yoxdursa dərhal Giriş ekranını açırıq
                if (!savedCode || savedCode.trim() === "" || savedCode === "null" || savedCode === "undefined") {
                    self.openLoginScreen();
                } else {
                    self.processLogin(savedCode);
                }
            } catch (e) {
                console.error("Splash keçid xətası önləndi, Girişə yönləndirilir: ", e);
                self.openLoginScreen();
            }
        }, 2000);
    },

    /**
     * ⏳ Splash ekranını bağlayıb rəsmi Login ekranını açan bölmə 
     */
    openLoginScreen: function() {
        this.currentFocusArea = "login";
        this.loginIdBuffer = "";
        this.currentLoginSubFocus = "input";
        
        var splashEl = document.getElementById("splash-screen");
        var loginEl = document.getElementById("login-screen");
        var navDrawer = document.getElementById("navigation-drawer");

        // Bütün kənar UI elementlərini sıfırlayırıq
        if (splashEl) splashEl.style.setProperty("display", "none", "important");
        if (navDrawer) navDrawer.style.display = "none";
        
        if (loginEl) {
            loginEl.style.setProperty("display", "flex", "important");
            var displayId = document.getElementById("login-id-display");
            if (displayId) displayId.innerText = "İstifadəçi ID";
        }

        // Simulyatorda klaviatura foksunu aktiv edirik
        setTimeout(function() {
            var inputEl = document.getElementById("login-id-display");
            if (inputEl) inputEl.focus();
        }, 100);

        console.log("🔑 KÜR IPTV: Splash bağlandı, ID Giriş maketi aktivdir.");
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
                            alert("Admin Bildirişi:\n" + msg);
                            FirebaseEngine.clearAdminMessage(code);
                        });

                        self.loadMediaData(userData);
                        self.currentFocusArea = "menu";
                        self.focusMenu(0);
                    } else {
                        self.openLoginScreen();
                    }
                })
                .catch(function(err) {
                    console.error("Giriş xətası sığortalandı: ", err);
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

    /**
     * 🎮 [GLOBAL PULT DÜYMƏ KÖPRÜSÜ] 
     */
    bindGlobalKeys: function() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            var keyCode = e.keyCode;

            if (self.currentFocusArea === "splash") return;

            // LOGIN REJİMİNDƏ PULT İDARƏSİ
            if (self.currentFocusArea === "login") {
                if (self.currentLoginSubFocus === "input") {
                    if (keyCode >= 48 && keyCode <= 57) { // 0-9 Rəqəmlər
                        self.handleLoginKeyPress(keyCode - 48);
                        return;
                    } else if (keyCode === 37) { // SOL -> Sil
                        self.handleLoginDelete();
                        return;
                    } else if (keyCode === 40) { // AŞAĞI -> Düyməyə keç
                        self.currentLoginSubFocus = "button";
                        var btnEl = document.getElementById("login-btn");
                        if (btnEl) btnEl.focus();
                        return;
                    }
                } else if (self.currentLoginSubFocus === "button") {
                    if (keyCode === 38) { // YUXARI -> Xanaya keç
                        self.currentLoginSubFocus = "input";
                        var inputEl = document.getElementById("login-id-display");
                        if (inputEl) inputEl.focus();
                        return;
                    }
                }
                
                if (keyCode === 13) { // OK (Enter)
                    if (self.loginIdBuffer.trim() !== "" && self.loginIdBuffer !== "İstifadəçi ID") {
                        self.processLogin(self.loginIdBuffer);
                    } else {
                        alert("Zəhmət olmasa ID kodunuzu yazın!");
                    }
                }
                return;
            }

            // PIN DIALOG AÇIKDIRSA
            if (self.currentFocusArea === "pin_dialog") {
                if (keyCode >= 48 && keyCode <= 57) {
                    ContextDialogEngine.handlePinInput(keyCode - 48);
                } else if (keyCode === 10009) { // Geri düyməsi (Tizen Return)
                    ContextDialogEngine.closePinDialog();
                    self.currentFocusArea = "channels";
                    if (window.ChannelAdapter) ChannelAdapter.focusItem(ChannelAdapter._focusedIndex);
                }
                return;
            }

            // KONTEKST MENYU AÇIKDIRSA
            if (self.currentFocusArea === "context_menu") {
                if (keyCode === 38) { // YUXARI
                    if (ContextDialogEngine.focusedOptionIdx > 0) {
                        ContextDialogEngine.focusOption(ContextDialogEngine.focusedOptionIdx - 1);
                    }
                } else if (keyCode === 40) { // AŞAĞI
                    if (ContextDialogEngine.focusedOptionIdx < ContextDialogEngine.options.length - 1) {
                        ContextDialogEngine.focusOption(ContextDialogEngine.options.length - 1);
                    }
                } else if (keyCode === 13) { // OK
                    ContextDialogEngine.handleOptionClick(ContextDialogEngine.focusedOptionIdx);
                } else if (keyCode === 10009) { // GERİ
                    ContextDialogEngine.closeContextMenu();
                    self.currentFocusArea = "channels";
                    if (window.ChannelAdapter) ChannelAdapter.focusItem(ChannelAdapter._focusedIndex);
                }
                return;
            }

            // YAN MENYUDADIRSA
            if (self.currentFocusArea === "menu") {
                if (keyCode === 38) { // YUXARI
                    if (self.focusedMenuIdx > 0) self.focusMenu(self.focusedMenuIdx - 1);
                } else if (keyCode === 40) { // AŞAĞI
                    if (self.focusedMenuIdx < self.menuItems.length - 1) self.focusMenu(self.focusedMenuIdx + 1);
                } else if (keyCode === 13) { // OK
                    self.handleMenuClick(self.focusedMenuIdx);
                } else if (keyCode === 39) { // SAĞ -> Kanallara keçid
                    var mainUi = document.getElementById("main-ui");
                    if (mainUi && mainUi.style.display !== "none" && window.ChannelAdapter) {
                        self.currentFocusArea = "channels";
                        ChannelAdapter.focusItem(0);
                    }
                }
                return;
            }

            // KANAL SİYAHISINDADIRSA
            if (self.currentFocusArea === "channels") {
                if (keyCode === 37) { // SOL -> Menyuya qayıt
                    self.currentFocusArea = "menu";
                    self.focusMenu(self.focusedMenuIdx);
                } else if (keyCode === 38) { // YUXARI
                    if (window.ChannelAdapter) ChannelAdapter.moveSelection(true);
                } else if (keyCode === 40) { // AŞAĞI
                    if (window.ChannelAdapter) ChannelAdapter.moveSelection(false);
                } else if (keyCode === 405 || keyCode === 418) { // Göy və ya Sarı düymə
                    if (window.ChannelAdapter && ChannelAdapter._channels.length > 0) {
                        var currentCh = ChannelAdapter._channels[ChannelAdapter._focusedIndex];
                        ContextDialogEngine.showContextMenu(currentCh);
                    }
                }
            }
        });
    },

    /**
     * Menyuda OK basanda görüləcək işlər (Strings.xml inteqrasiyalı)
     */
    handleMenuClick: function(index) {
        for (var i = 0; i < this.menuItems.length; i++) {
            var item = document.getElementById(this.menuItems[i]);
            if (item) item.classList.remove("active");
        }
        
        var activeItem = document.getElementById(this.menuItems[index]);
        if (activeItem) activeItem.classList.add("active");
        
        var mainUi = document.getElementById("main-ui");
        var aboutUi = document.getElementById("about-ui");
        
        if (mainUi) mainUi.style.display = "none";
        if (aboutUi) aboutUi.style.display = "none";
        
        if (index === 0) { // 📺 "Kanallar" seçildisə
            if (mainUi) mainUi.style.display = "block";
        } else if (index === 3) { // ℹ "Haqqımızda" seçildisə
            if (aboutUi) {
                document.getElementById("aboutTitle").innerText = Locale.get("about_title");
                document.getElementById("aboutVersion").innerText = Locale.get("about_version");
                document.getElementById("aboutMainText").innerText = Locale.get("about_main_text");
                document.getElementById("aboutMessage").innerText = Locale.get("about_message");
                document.getElementById("aboutExtra").innerText = Locale.get("about_extra_text");
                aboutUi.style.display = "flex";
            }
        } else {
            if (index === 1) alert(Locale.get("menu_tutorial") + " bölməsi yaxında aktiv olacaq!");
            if (index === 2) alert(Locale.get("menu_settings") + " bölməsi yaxında aktiv olacaq!");
        }
    },

    /**
     * Adapter kliklərini və pult fokslarını pleyerə bağlayan funksiya
     */
    setupAdapterListeners: function() {
        if (!window.ChannelAdapter || !window.PlayerEngine) return;
        
        // Kanalın üzərinə klikləyəndə PIN Şifrə sığortası yoxlanılır
        ChannelAdapter.onClick = function(channel) {
            ContextDialogEngine.checkPinAndPlay(channel);
        };
        
        // Kanallar üzərində pultla gəzdikdə Zapping sığortası
        ChannelAdapter.onFocusAction = function(channel, index) {
            var savedPin = localStorage.getItem("LOCK_" + channel.url);
            if (!savedPin) {
                PlayerEngine.zappingPlay(channel, index);
            } else {
                PlayerEngine.currentIndex = index;
            }
        };
    },

    /**
     * Firebase-dən gələn dataya əsasən parsinq prosesini başladan funksiya
     */
    loadMediaData: function(userData) {
        if (!window.ChannelRepository || !window.ChannelAdapter) return;
        
        var m3uUrl = userData.m3u_url || "";
        var epgUrl = userData.epg_url || "";
        
        // EPG yenilənəndə bura tetiklenir
        ChannelRepository.setUiUpdateListener(function() {
            console.log("🔄 EPG verilənləri uğurla yeniləndi!");
        });
        
        if (m3uUrl !== "") {
            ChannelRepository.fetchFromM3u(m3uUrl, function(success) {
                if (success) {
                    var allChannels = ChannelRepository.getChannels();
                    // Ümumi siyahını pleyerə və adapterə ötürürük
                    PlayerEngine.channelsList = allChannels;
                    ChannelAdapter.updateData(allChannels);
                    
                    // Əgər M3U daxilindən EPG çıxmayıbsa, ayrıca yükləyirik
                    if (epgUrl !== "" && !ChannelRepository._epgUrl) {
                        ChannelRepository.fetchEpg(epgUrl);
                    }
                }
            });
        }
    }
};

// Səhifə tam hazır olan kimi rəsmi olaraq tətbiqi başladırıq
window.onload = function() {
    AppCore.init();
};
