import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-ink-soft">
      <p className="kicker">कानुन</p>
      <h1 className="font-display text-4xl font-normal text-ink">गोपनीयता नीति</h1>
      <p className="text-sm text-muted">अन्तिम अद्यावधिक: २०८३ भदौ २२</p>
      <p>
        KalaiyaOnline (“हामी”, “एप”, kalaiyaonline.com) कलैया, बारा र मधेशका समाचार,
        ग्यालरी, डाइरेक्ट्री, सेयर बजार, पात्रो, मौसम, च्याट, दर्ता सदस्य र रक्तदाता सेवा
        सञ्चालन गर्छ। यो नीतिले हालको एपमा संकलन हुने जानकारी र प्रयोग स्पष्ट पार्छ।
      </p>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">१. हामी के संकलन गर्छौं</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>खाता: नाम, इमेल, पासवर्ड (एन्क्रिप्टेड), मोबाइल, ठेगाना, उमेर, भूमिका।</li>
          <li>प्रोफाइल: फोटो र सार्वजनिक प्रोफाइल विवरण।</li>
          <li>समाचार गतिविधि: कमेन्ट, लाइक/डिसलाइक, सेभ, हेराइ गणना, सामाजिक सेयर।</li>
          <li>ग्यालरी र डाइरेक्ट्री: हेराइ गणना; डाइरेक्ट्रीमा नाम, श्रेणी, फोन, इमेल, स्थान, तस्बिर।</li>
          <li>च्याट: साथी अनुरोध, सन्देश; अश्लील शब्द प्रयोगको चेतावनी लग प्रशासकलाई।</li>
          <li>रक्तदाता/आकस्मिक अनुरोध: नाम, रक्त समूह, फोन, स्थान, उमेर, फोटो।</li>
          <li>मौसम: तपाईंले अनुमति दिएको जियोलोकेसन (अक्षांश/देशान्तर)। अनुमति नभए कलैयाको मौसम देखाइन्छ।</li>
          <li>यन्त्रमा रहने कुरा: सेभ समाचार, टेक्स्ट साइज, सूचना बन्द सेटिङ (local storage)।</li>
          <li>लगइन सत्र कुकी / टोकनबाट चल्छ।</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">२. किन प्रयोग गर्छौं</h2>
        <p>
          खाता चिन्न, समाचार/ग्यालरी/डाइरेक्ट्री देखाउन, कमेन्ट र च्याट चलाउन, रक्तदाता जोड्न,
          मौसम र सेयर टिकर देखाउन, दुरुपयोग रोक्न, विज्ञापन राख्न र एप सुधार गर्न। हामी
          व्यक्तिगत डेटा तेस्रो पक्षलाई बेच्दैनौं।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">३. कसले देख्छ</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>समाचार, ग्यालरी, डाइरेक्ट्री, सेयर बजार, पात्रो, मौसम र रक्तदाता सूची सार्वजनिक हुन सक्छन्।</li>
          <li>दर्ता सदस्य सूची र प्रोफाइल अन्य प्रयोगकर्ताले देख्न सक्छन्।</li>
          <li>च्याट सन्देश सम्बन्धित प्रयोगकर्ताले मात्र देख्छन्।</li>
          <li>प्रशासकले खाता, भूमिका, विज्ञापन, समाचार डेस्क र चेतावनी लग व्यवस्थापन गर्न सक्छ।</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">४. तेस्रो पक्ष सेवा</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>लगइन र इमेल रिकभरी — प्रमाणीकरण सेवा।</li>
          <li>मौसम — Open-Meteo र स्थान नामका लागि OpenStreetMap Nominatim।</li>
          <li>सेयर बजार — सार्वजनिक NEPSE/नेपाली पैसा स्रोत।</li>
          <li>सामाजिक सेयर — Facebook, X, WhatsApp।</li>
          <li>होस्टिङ — वेब होस्ट र डाटाबेस प्रदायक (जस्तै Vercel, PostgreSQL)।</li>
          <li>विज्ञापन — प्रशासकले राखेको तस्बिर, पाठ वा HTML; बाह्य लिंक हुन सक्छ।</li>
        </ul>
        <p>ती सेवाको आफ्नै गोपनीयता नीति लागू हुन्छ।</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">५. स्थान र मौसम</h2>
        <p>
          मौसम बारका लागि ब्राउजरले स्थान अनुमति माग्छ। अनुमति दिए अक्षांश/देशान्तर सर्भरमा
          पठाई तापक्रम निकालिन्छ; ठीक ठेगाना संकलन गरिँदैन। अनुमति अस्वीकार गरे कलैयाको मौसम
          देखिन्छ। यो अनुमति जुनसुकै बेला ब्राउजर सेटिङबाट फिर्ता लिन सकिन्छ।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">६. कुकी र सूचना</h2>
        <p>
          सत्र कायम राख्न कुकी प्रयोग हुन्छ। एपभित्र सूचना घण्टी र ब्राउजर सूचना अनुमति माग्न
          सकिन्छ। अनुमति बिना पुश पठाइँदैन।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">७. च्याट र दुरुपयोग</h2>
        <p>
          अश्लील वा आपत्तिजनक शब्द (नेपाली, अंग्रेजी, हिन्दी, भोजपुरी) पठाए सन्देश रोकिन सक्छ
          र खाता हटाउने चेतावनी आउन सक्छ। त्यस्ता प्रयासको लग प्रशासकले हेर्न सक्छ।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">८. तपाईंका अधिकार</h2>
        <p>
          प्रोफाइल, फोटो, मोबाइल, ठेगाना र पासवर्ड अद्यावधिक गर्न सकिन्छ। खाता, कमेन्ट वा
          रक्तदाता रेकर्ड हटाउन प्रशासनलाई सम्पर्क गर्नुहोस्। पासवर्ड बिर्सिए रिकभरी इमेल प्रयोग
          गर्नुहोस्।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">९. बालबालिका</h2>
        <p>यो एप सामान्य पाठकका लागि हो। १६ वर्षमुनिका बालबालिकालाई अभिभावकको सहमतिबिना खाता नखोल्न अनुरोध छ।</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">१०. नीति परिवर्तन</h2>
        <p>
          एपमा नयाँ सुविधा आए यो पृष्ठ अद्यावधिक हुन्छ। मिति माथिको “अन्तिम अद्यावधिक” मा
          हेर्नुहोस्।
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-2xl text-ink">११. सम्पर्क</h2>
        <p>
          नीतिबारे प्रश्न भए <Link to="/about" className="text-crimson hover:underline">हाम्रोबारे</Link> मा
          दिइएको फोन, इमेल वा ठेगानामा लेख्नुहोस्।
        </p>
      </section>
    </article>
  );
}
