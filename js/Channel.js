/**
 * KÜR IPTV - Channel Model
 * Kanalların strukturunu idarə edən baza obyekti
 */
function Channel(id, name, url, logoUrl, isFavorite) {
    this.id = id || "";
    this.name = name || "Adsız Kanal";
    this.url = url || "";
    this.logoUrl = logoUrl || "img/yenilogom.png";
    this.isFavorite = isFavorite || false;
}
