/**
 * KÜR IPTV - Tizen Hardware Player Engine (Klassik ES5 AVPlay Model)
 * Android PlayerActivity daxilindəki Audio Dil, OTT Menyu və Taymerlərin 100% rəsmi TV qarşılığı
 * 🛠 100% TƏMİZLƏNMİŞ VƏ MPEG-TS DƏSTƏKLİ VARIANT
 */
var PlayerEngine = {
    zappingTimeout: null,
    infoPanelTimeout: null,
    hideMenuTimeout: null,
    currentUrl: "",
    channelsList: [],
    currentIndex: 0,
    channelBuffer: "",
    bufferTimeout: null,
    hlsInstance: null,

    /**
     * 📺 [PLEYER BÜNÖVRƏSİ]
     */
    init: function() {
        console.log("KÜR IPTV: Tizen AVPlay Player başladıldı.");
        
        var videoElement = document.getElementById('tvPlayer');
        if (!videoElement) {
            var wrapper = document.getElementById('player-wrapper');
            if (wrapper) {
                videoElement = document.createElement('video');
                videoElement.id = 'tvPlayer';
                videoElement.style.position = 'absolute';
                videoElement.style.top = '0';
                videoElement.style.left = '0';
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.zIndex = '1';
                videoElement.style.backgroundColor = '#000000';
                wrapper.appendChild(videoElement);
            }
        }

        if (window.tizen && window.tizen.tvinputdevice) {
            try {
                tizen.tvinputdevice.registerKey("MediaAudioTrack");
                tizen.tvinputdevice.registerKey("0");
                tizen.tvinputdevice.registerKey("1");
                tizen.tvinputdevice.registerKey("2");
                tizen.tvinputdevice.registerKey("3");
                tizen.tvinputdevice.registerKey("4");
                tizen.tvinputdevice.registerKey("5");
                tizen.tvinputdevice.registerKey("6");
                tizen.tvinputdevice.registerKey("7");
                tizen.tvinputdevice.registerKey("8");
                tizen.tvinputdevice.registerKey("9");
                tizen.tvinputdevice.registerKey("ChUp");
                tizen.tvinputdevice.registerKey("ChDown");
            } catch (e) {
                console.error("Düymə qeydiyyat xətası: ", e);
            }
        }
    },

    /**
     * 🏎 [800MS ZAPPING EFFEKTİ]
     */
    zappingPlay: function(channel, index) {
        var self = this;
        this.currentIndex = index;
        if (this.zappingTimeout) clearTimeout(this.zappingTimeout);
        this.zappingTimeout = setTimeout(function() {
            var savedPin = localStorage.getItem("LOCK_" + channel.url);
            if (!savedPin && window.AppCore && AppCore.currentFocusArea === "channels") {
                self.actualPlay(channel.url, channel.name);
            }
        }, 800);
    },

    /**
     * 🎬 [SAMSUN TV HARDWARE AVPLAY MODULU VƏ SMART FALLBACK]
     */
    actualPlay: function(url, name) {
        var self = this;
        try {
            this.currentUrl = url;
            this.stop();
            
            var videoElement = document.getElementById('tvPlayer');

            if (typeof TVXServices !== 'undefined' && TVXServices.Player) {
                console.log("PlayerEngine: MSX daxili video mühərriki çağırılır...");
                TVXServices.Player.play({
                    url: url,
                    type: "video:hls",
                    title: name
                });
                self.showInfoPanel(name);
                return;
            }

            if (window.webapis && window.webapis.avplay && typeof window.webapis.avplay.open === 'function' && navigator.userAgent.includes("Tizen")) {
                webapis.avplay.open(url);
                
                if (url.indexOf("mpegts") !== -1 || url.indexOf(".ts") !== -1 || url.indexOf("mpeg") !== -1) {
                    webapis.avplay.setStreamingProperty("IS_LIVE", "true");
                }
                
                webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
                webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
                webapis.avplay.setStreamingProperty("SET_MODE_4K", "true");
                
                var playerListener = {
                    onbufferingstart: function() { console.log("Video Buferlənir..."); },
                    onbufferingcomplete: function() { console.log("Buferlənmə Tamamlandı."); },
                    onstreamcompleted: function() { self.stop(); },
                    onerror: function(error) { console.error("AVPlay Daxili Xətası: ", error); }
                };
                
                webapis.avplay.setListener(playerListener);
                
                webapis.avplay.prepareAsync(function() {
                    webapis.avplay.play();
                    self.showInfoPanel(name);
                }, function(err) {
                    console.error("Pleyer hazırlıq xətası, fallback-ə keçilir: ", err);
                    self.fallbackPlayer(url, videoElement, name);
                });
            } else {
                self.fallbackPlayer(url, videoElement, name);
            }
        } catch (e) {
            console.error("AVPlay Kritik xətası bypass edildi: ", e);
            self.fallbackPlayer(url, document.getElementById('tvPlayer'), name);
        }
    },

    /**
     * 🌐 [TİZEN SİMULYATORU ÜÇÜN 100% TƏHLÜKƏSİZ FALLBACK]
     */
    fallbackPlayer: function(url, el, name) {
        if (!el) return;
        var self = this;
        el.style.opacity = "1";

        try {
            var GlobalHls = window.Hls || (typeof window !== 'undefined' ? window['Hls'] : null);
            if (GlobalHls && typeof GlobalHls.isSupported === 'function' && GlobalHls.isSupported()) {
                console.log("PlayerEngine: Təhlükəsiz Hls.js sığortası aktiv edildi.");
                var hls = new GlobalHls({
                    maxBufferLength: 10,
                    enableWorker: false
                });
                this.hlsInstance = hls;
                hls.loadSource(url);
                hls.attachMedia(el);
                hls.on(GlobalHls.Events.MANIFEST_PARSED, function() {
                    el.play().catch(function(){});
                });
                self.showInfoPanel(name);
                return;
            }
        } catch (hlsError) {
            console.log("Hls.js simulyator mühərriki bypass olundu:", hlsError);
        }

        el.src = url;
        el.play().catch(function(){});
        self.showInfoPanel(name);
    },

    /**
     * 🛑 PLEYERİ DAYANDIRMAQ
     */
    stop: function() {
        console.log("KÜR IPTV: AVPlay tam dayandırıldı, TV prosessoru boşaldı.");
        if (this.hlsInstance) {
            try {
                this.hlsInstance.destroy();
            } catch(e){}
            this.hlsInstance = null;
        }
        try {
            if (window.webapis && window.webapis.avplay && typeof window.webapis.avplay.stop === 'function') {
                webapis.avplay.stop();
                webapis.avplay.close();
            }
        } catch (e) {}
    },

    /**
     * 🔢 [PULTDAN RƏQƏMLƏ KANAL YIĞMA]
     */
    handleNumberInput: function(num) {
        var self = this;
        this.channelBuffer += num;
        if (this.bufferTimeout) clearTimeout(this.bufferTimeout);
        this.bufferTimeout = setTimeout(function() {
            var targetNum = parseInt(self.channelBuffer, 10);
            var targetIndex = targetNum - 1;
            
            if (targetIndex >= 0 && targetIndex < self.channelsList.length) {
                var ch = self.channelsList[targetIndex];
                if (window.ContextDialogEngine) {
                    ContextDialogEngine.checkPinAndPlay(ch);
                } else {
                    self.actualPlay(ch.url, ch.name);
                }
                if (window.ChannelAdapter) {
                    ChannelAdapter._focusedIndex = targetIndex;
                    ChannelAdapter.focusItem(targetIndex);
                }
            } else {
                alert("Kanal tapılmadı: " + targetNum);
            }
            self.channelBuffer = "";
        }, 1500);
    },

    /**
     * 🎚️ [CANLI YAYIM INFO PANELİNİ GÖSTƏRMƏK]
     */
    showInfoPanel: function(name) {
        var infoPanel = document.getElementById("infoPanel");
        if (!infoPanel) return;

        var nameEl = document.getElementById("infoChannelName");
        var numEl = document.getElementById("infoChannelNumber");

        if (nameEl) nameEl.innerText = name;
        if (numEl) {
            var currentNum = this.currentIndex + 1;
            numEl.innerText = currentNum < 10 ? "0" + currentNum : currentNum;
        }

        infoPanel.style.display = "block";

        if (this.infoPanelTimeout) clearTimeout(this.infoPanelTimeout);
        this.infoPanelTimeout = setTimeout(function() {
            infoPanel.style.display = "none";
        }, 4000);
    },

    /**
     * 🏎️ [PULTDAN CH+ VƏ CH- DÜYMƏLƏRİ İLƏ KANAL DƏYİŞMƏ]
     */
    changeChannel: function(isNext) {
        if (this.channelsList.length === 0) return;

        var nextIndex = isNext ? this.currentIndex + 1 : this.currentIndex - 1;

        if (nextIndex >= this.channelsList.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = this.channelsList.length - 1;

        this.currentIndex = nextIndex;
        var nextChannel = this.channelsList[nextIndex];

        if (nextChannel) {
            if (window.ChannelAdapter) {
                ChannelAdapter._focusedIndex = nextIndex;
                if (window.AppCore && AppCore.currentFocusArea === "channels") {
                    ChannelAdapter.focusItem(nextIndex);
                }
            }
            
            if (window.ContextDialogEngine) {
                ContextDialogEngine.checkPinAndPlay(nextChannel);
            } else {
                this.actualPlay(nextChannel.url, nextChannel.name);
            }
        }
    },

    /**
     * 🌐 [AUDIO DİLİNİ DƏYİŞMƏK] - Pultun MediaAudioTrack düyməsi üçün
     */
    switchAudioTrack: function() {
        try {
            if (window.webapis && window.webapis.avplay && typeof webapis.avplay.getTotalTrackInfo === "function") {
                var trackInfo = webapis.avplay.getTotalTrackInfo();
                var currentAudioIndex = 0;
                var audioTracks = [];

                for (var i = 0; i < trackInfo.length; i++) {
                    if (trackInfo[i].type === "AUDIO") {
                        audioTracks.push(trackInfo[i]);
                        if (trackInfo[i].index === webapis.avplay.getCurrentTrackInfo("AUDIO").index) {
                            currentAudioIndex = audioTracks.length - 1;
                        }
                    }
                }

                if (audioTracks.length > 1) {
                    var nextAudioIndex = (currentAudioIndex + 1) % audioTracks.length;
                    webapis.avplay.setCurrentTrack("AUDIO", audioTracks[nextAudioIndex].index);
                    alert("Audio dili dəyişdirildi: " + audioTracks[nextAudioIndex].extra_info);
                } else {
                    console.log("Bu kanalda alternativ audio dili tapılmadı.");
                }
            }
        } catch (e) {
            console.error("Audio Track dəyişmə xətası: ", e);
        }
    },

    resetHideTimer: function() {
        if (this.infoPanelTimeout) {
            var infoPanel = document.getElementById("infoPanel");
            if (infoPanel && infoPanel.style.display === "block") {
                this.showInfoPanel(document.getElementById("infoChannelName").innerText);
            }
        }
    }
};
