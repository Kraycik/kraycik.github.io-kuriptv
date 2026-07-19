/**
 * KÜR IPTV - Tizen Channel List Adapter & Focus Controller (Klassik ES5)
 * Simulyator və real TV üçün şəkil xətalarından tam təmizlənmiş sarsılmaz rəsmi motor
 */
var ChannelAdapter = {
    _containerId: "recyclerViewChannels",
    _channels: [],
    _focusedIndex: 0,
    _zappingTimeout: null, // Sürətli keçid zamanı TV-nin donmaması üçün taymer
    onClick: null,
    onLongClick: null,
    onFocusAction: null,

    /**
     * Siyahını tamamilə yeniləyən və ekrana basan funksiyası (updateData qarşılığı)
     */
    updateData: function(newList) {
        console.log("📺 ChannelAdapter: updateData işə düşdü. Gələn kanal sayı: " + (newList ? newList.length : 0));
        this._channels = newList || [];
        this._focusedIndex = 0;
        this.render();
    },

    /**
     * HTML DOM elementlərini sıfırdan yaradan professional Generator
     */
    render: function() {
        var self = this;
        var container = document.getElementById(this._containerId);
        if (!container) {
            console.error("🚨 Xəta: Siyahı konteyneri (#" + this._containerId + ") DOM-da tapılmadı!");
            return;
        }

        container.innerHTML = ""; // Köhnə siyahını təmizləyirik

        // 🚀 UI INTERFEYS KEÇİD SİĞORTASI: Kanallar gəlibsə, Giriş ekranını bağla, Əsas UI-ı dərhal aç!
        var splashEl = document.getElementById("splash-screen");
        var loginEl = document.getElementById("login-screen");
        var navDrawer = document.getElementById("navigation-drawer");
        var mainUi = document.getElementById("main-ui");

        if (splashEl) splashEl.style.setProperty("display", "none", "important");
        if (loginEl) loginEl.style.setProperty("display", "none", "important");
        if (navDrawer) navDrawer.style.setProperty("display", "flex", "important");
        if (mainUi) mainUi.style.setProperty("display", "block", "important");

        // Əgər kanal yoxdursa, boşluq mesajını göstərək
        var emptyMsg = document.getElementById("tvEmptyMessage");
        if (this._channels.length === 0) {
            if (emptyMsg) emptyMsg.style.setProperty("display", "block", "important");
            console.log("⚠ Göstəriləcək kanal yoxdur, boşluq mesajı aktiv edildi.");
            return;
        } else {
            if (emptyMsg) emptyMsg.style.setProperty("display", "none", "important");
        }

        for (var i = 0; i < this._channels.length; i++) {
            (function(index) {
                var channel = self._channels[index];
                if (!channel) return;

                var item = document.createElement("div");
                item.className = "item-channel";
                item.id = "ch_item_" + index;
                item.setAttribute("tabindex", "0"); // Pult fokusu üçün vacib şərt

                var logoUrl = channel.logoUrl || "img/yenilogom.png";
                
                // Məcburi şəkildə sətir formatına çeviririk ki, .trim() funksiyası çökmə verməsin
                if (logoUrl) {
                    logoUrl = String(logoUrl);
                }

                // 🛡️ ZƏDƏLİ LOQO SİĞORTASI
                if (!logoUrl || logoUrl.trim() === "" || logoUrl.indexOf("tvg-logo") !== -1 || logoUrl === "null") {
                    logoUrl = "img/yenilogom.png";
                }

                var channelName = channel.name || "Adsız Kanal";

                // 🛠️ KRİTİK DÜZƏLİŞ: favoritStar.png tamamilə ləğv edildi, yerinə CSS ilə idarə olunan mətn ulduzu qoyuldu!
                var starHtml = '';
                if (channel.isFavorite) {
                    starHtml = '<span class="favoritStarText" style="color: #FFD700; margin-left: auto; font-size: 30px; font-weight: bold; padding-right: 10px;">★</span>';
                }

                item.innerHTML = '<img src="' + logoUrl + '" class="channelIcon" onerror="this.src=\'img/yenilogom.png\'"/>' +
                                 '<span class="channelName" id="ch_text_' + index + '">' + channelName + '</span>' +
                                 starHtml;

                // Pult ilə üzərinə gələndə (FocusChangeListener qarşılığı)
                item.addEventListener("focus", function() {
                    self._focusedIndex = index;
                    self.applyFocusEffect(item, index, channel);
                });

                // Fokusdan çıxanda (Focus Lost)
                item.addEventListener("blur", function() {
                    self.removeFocusEffect(item, index);
                });

                // Klikləyəndə (OnClickListener)
                item.addEventListener("click", function() {
                    if (self.onClick) self.onClick(channel);
                });

                container.appendChild(item);
            })(i);
        }

        // İlk elementi fokuslandırıb pult idarəsini aktiv edirik
        console.log("🎯 Adapter: Render tamamlandı. İlk element fokuslanır...");
        
        // Pultun idarəetmə rejimini kanallara ötürürük
        if (window.AppCore) {
            window.AppCore.currentFocusArea = "channels";
        }
        
        // Kiçik bir fasilə ilə DOM-un özünə gəlməsini gözləyib fokus atırıq (TV-lər üçün ən təhlükəsiz üsul)
        setTimeout(function() {
            self.focusItem(0);
        }, 100);
    },

    /**
     * 🏎️ [MƏRCEDES FOKUS EFFEKTİ] - Android animasiyasının CSS ilə 100% bərabərləşdirilməsi
     */
    applyFocusEffect: function(element, index, channel) {
        var self = this;
        element.style.transform = "scale(1.05)";
        element.style.backgroundColor = "rgba(33, 150, 243, 0.26)"; // Mavi-bənövşəyi effekt
        element.style.zIndex = "10";
        
        var textNode = document.getElementById("ch_text_" + index);
        if (textNode) textNode.style.color = "yellow"; // Aktiv kanalda yazının sarı olması

        // PlayerActivity-dəki gizlənmə taymerini sıfırlayırıq
        if (window.PlayerEngine && typeof PlayerEngine.resetHideTimer === "function") {
            PlayerEngine.resetHideTimer();
        }

        // 🛡️ SMART TV ZAPPING SIĞORTASI (Donma əleyhinə 400ms gözləmə əlavə olundu)
        if (this._zappingTimeout) clearTimeout(this._zappingTimeout);
        this._zappingTimeout = setTimeout(function() {
            if (self.onFocusAction) {
                self.onFocusAction(channel, index);
            }
        }, 400);

        // Siyahının avtomatik aşağı-yuxarı sürüşməsi (Scroll To Position)
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },

    removeFocusEffect: function(element, index) {
        element.style.transform = "scale(1.0)";
        element.style.backgroundColor = "transparent";
        element.style.zIndex = "1";

        var textNode = document.getElementById("ch_text_" + index);
        if (textNode) textNode.style.color = "white";
    },

    focusItem: function(index) {
        if (index >= 0 && index < this._channels.length) {
            var element = document.getElementById("ch_item_" + index);
            if (element) {
                element.focus();
            }
        }
    },

    /**
     * Pultdan Aşağı və Yuxarı basanda siyahıda gəzmək funksiyası
     */
    moveSelection: function(isUp) {
        var targetIndex = isUp ? this._focusedIndex - 1 : this._focusedIndex + 1;
        if (targetIndex >= 0 && targetIndex < this._channels.length) {
            this.focusItem(targetIndex);
        }
    }
};
