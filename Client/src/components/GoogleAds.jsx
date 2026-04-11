import { useEffect } from'react';

const GoogleAds = () => {
 useEffect(() => {
 const script = document.createElement('script');
 script.src ='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
 script.async = true;
 script.setAttribute('data-ad-client','ca-pub-7704358624083535');
 document.head.appendChild(script);

 try {
 (window.adsbygoogle = window.adsbygoogle || []).push({});
 } catch (e) {
 console.error("Adsense error", e);
 }
 }, []);

 return (
 <div className="w-80 h-80">
 <ins
 className="adsbygoogle"
 style={{ display:'block'}}
 data-ad-client="ca-pub-7704358624083535"
 data-ad-slot="5535443803"
 data-ad-format="auto"
 data-full-width-responsive="true"
 ></ins>
 </div>
 );
};

export default GoogleAds;
