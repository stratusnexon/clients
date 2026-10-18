export default {
  async fetch(request) {
    const url = new URL(request.url);
    const redirects = {
      "/uno": "https://zipstream.stratusnex.workers.dev/canaluno/live.m3u8",
      "/index.html": "https://www.stratusnex.workers.dev/",
      "/index.php": "https://www.stratusnex.workers.dev/",
      "/": "https://www.stratusnex.workers.dev/",
      "/metro": "http://200.59.213.66:8000/play/a01n/index.m3u8",
      "/redtlrosario/playlist.m3u8": "http://nd106.republicaservers.com/redtlrosario.mp4",
"/12": "http://45.188.229.33:8000/play/a1cn/index.m3u8",
"/21": "http://45.70.221.206/CRONICA_OTT/playlist.m3u8",
"/5": "http://45.188.229.33:8000/play/a0x2/index.m3u8",
"/185537.m3u8": "http://lamtv.site:8080/27116808/zs2Bbc7Zu5/185537.ts",
"/480.m3u8": "http://45.226.28.9:8085/Live/f79e50c4e9d7bb6b44dbb00b16ca3fdf/local-kzo.playlist.m3u8",
"/34.m3u8": "http://45.188.229.33:8000/play/a1d5/index.m3u8",
"/35.m3u8": "http://181.209.38.115:8000/play/a014/index.m3u8",
"/37.m3u8": "http://45.179.152.42:8000/play/a03o",
"/39.m3u8": "http://181.209.38.115:8000/play/a03j/index.m3u8",
"/40.m3u8": "http://181.209.38.115:8000/play/a02r/index.m3u8",
"/42.m3u8": "https://stream1.sersat.com/hls/garagetv.m3u8",
"/46.m3u8": "http://45.226.28.9:8085/Live/6fb1f0e7eb180cb1c37841fb3e8a163b/local-nuevelitoral_480.m3u8",
"/55.m3u8": "http://38.224.175.2:8000/play/a011/index.m3u8",
"/54.m3u8": "http://45.188.229.33:8000/play/a18u/index.m3u8",
"/57.m3u8": "http://45.188.229.33:8000/play/a1cp/index.m3u8",
"/qmtv2.m3u8": "http://200.59.213.66:8000/play/a01u/index.m3u8?hls",
"/tyc.m3u8": "http://181.209.38.115:8000/play/a00k/index.m3u8",
"/rai.m3u8": "http://181.209.38.115:8000/play/a05d/index.m3u8",
"/tyc-1.m3u8": "http://38.44.109.41:8003/play/a02l/index.m3u8",
"/60.m3u8": "http://45.188.229.33:8000/play/a1ae/index.m3u8",
"/61.m3u8": "http://45.188.229.33:8000/play/a1ae/index.m3u8",
"/62.m3u8": "http://45.134.141.161:2200/ARG/DAZN_1_HD/index.m3u8",
"/a1cq/index.m3u8": "http://45.188.229.33:8000/play/a1cq/index.m3u8",
"/a03f.m3u8": "http://45.179.152.42:8000/play/a03f",
"/a0qe/index.m3u8": "http://187.245.231.226:8000/play/a0qe/index.m3u8",
"/167774.m3u8": "http://redworld.pro:8880/263738263828/mtRGzMLrXMd2/167774",
"/a11v/index.m3u8": "http://45.188.229.33:8000/play/a11v/index.m3u8",
"/a0we/index.m3u8": "http://45.188.229.33:8000/play/a0we/index.m3u8",
"/qmtv.m3u8": "http://200.59.213.66:8000/play/a01u/index.m3u8?hls",
"/dsport.m3u8": "http://45.188.229.33:8000/play/a1iw/index.m3u8",
"/dsport2.m3u8": "https://s2.bufaloweb.com/bufalo10/tracks-v1a1/mono.ts.m3u8",
"/tnts.m3u8": "http://181.209.38.115:8000/play/a00j/index.m3u8?hls",
"/tnts2.m3u8": "http://nexusconnects.org:80/play/live.php?mac=00:1B:79:35:03:89&stream=1090608&extension=ts&play_token=YvNT7EN2oR",
"/Eurosport_1_HD/index.m3u8": "http://45.134.141.161:2200/ARG/Eurosport_1_HD/index.m3u8",
"/Eurosport_2_HD/index.m3u8": "http://45.134.141.161:2200/ARG/Eurosport_2_HD/index.m3u8",
      "/eltrece.mpd": "https://cyberuno.cdn.rcs.net.ar/mnp/el13/output.mpd",
      "/telefe.m3u8": "http://45.134.141.161:2200/ARG/TELEFE_HD/index.m3u8",    
      "/antena3.m3u8": "http://190.108.93.180:8000/play/a01n/index.m3u8",
      "/somosrosario.m3u8": "http://45.226.28.9:8085/Live/f79e50c4e9d7bb6b44dbb00b16ca3fdf/local-santafecanal.playlist.m3u8",
      "/c02k.m3u8": "http://45.5.118.152:8000/play/a05t/index.m3u8",
      "/dgo.m3u8": "http://planettvweb.com:8091/Carmen65/RMap9748d/116384",
      "/vive.m3u8": "https://vivo.solumedia.com:19360/vivetv/vivetv.m3u8",
      "/Discovery_Turbo_HD/index.m3u8": "http://45.134.141.161:2200/ARG/Discovery_Turbo_HD/index.m3u8",
"/Discovery_World_HD/index.m3u8": "http://45.134.141.161:2200/ARG/Discovery_World_HD/index.m3u8",
"/Discovery_Investigation_HD/index.m3u8": "http://45.134.141.161:2200/ARG/Discovery_Investigation_HD/index.m3u8",
"/a0xr/index.m3u8": "http://45.188.229.33:8000/play/a0xr/index.m3u8",
      "/tvn.m3u8": "http://38.224.175.2:8000/play/a02r/index.m3u8",
      "/hh.m3u8": "https://cyberuno.cdn.rcs.net.ar/mnp/disc_hh_hls/playlist.m3u8",
"/disc_theater.m3u8": "https://cyberuno.cdn.rcs.net.ar/mnp/disc_theater_hls/playlist.m3u8",
"/discovery.m3u8": "https://cyberuno.cdn.rcs.net.ar/mnp/discovery_hls/playlist.m3u8",
      "/telefesantafe.m3u8": "http://45.226.28.9:8085/Live/f6a4fcaf4ec8aba3143d297b68b311f6/local-canal13santafe.playlist.m3u8",
      "/telefeinterior.m3u8": "http://200.91.32.158:8080/telefehdvalle/index.m3u8",
      "/telemundo-noticias.m3u8": "http://38.224.175.2:8000/play/a05t/index.m3u8",
      "/telemundo.m3u8": "http://38.224.175.2:8000/play/a01w/index.m3u8",
      "/12misiones.m3u8": "http://45.179.152.42:8000/play/a03l",
      "/tcl.m3u8": "http://38.44.109.41:8003/play/a0ep/index.m3u8",
      "/cgtn.m3u8": "http://38.137.192.250:8000/play/a0fb",
      "/multivisionfederal.m3u8": "https://videostream.shockmedia.com.ar:19360/multivisionfederal/multivisionfederal.m3u8",
      "/aire.m3u8": "http://mdstrm.com/live-stream-playlist/6931a0eb06778645348008e0.m3u8",
      "/a0kl.m3u8": "http://181.119.215.61:8000/play/a0kl/index.m3u8",
      "/europa.m3u8": "http://45.70.221.206/EUROPA_EUROPA_OTT/playlist.m3u8",
      "/dpsort-1.m3u8": "http://45.70.221.206/DSPORTS_OTT/playlist.m3u8",
      "/lnmas.m3u8": "http://45.70.221.206/LN_OTT/playlist.m3u8",
      "/CM.m3u8": "http://45.70.221.206/CM_OTT/playlist.m3u8"
    
    };

    const target = redirects[url.pathname];

    if (target) {
      return Response.redirect(target, 301);
    }

    return new Response("Streaming o Servidor no disponible", { status: 404 });
  }
};
