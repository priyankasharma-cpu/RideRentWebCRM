import { rentalPolicy } from './rentalPolicy.js';

// English is the approved source. Keep all translated clauses and section IDs aligned.
const simpleHindi = {
  lang: 'hi',
  title: 'RideRent — गाड़ी किराये पर लेने की Policy',
  location: 'इंदौर, मध्य प्रदेश, भारत',
  operator: '[Registered Business Name भरें]',
  registeredAddress: '[इंदौर का पूरा business address भरें]',
  contact: '[फ़ोन और ईमेल भरें]',
  eyebrow: 'किराये की शर्तें · इंदौर',
  languageLabel: 'भाषा चुनें',
  availableNote: 'English, सरल हिंदी और Easy Hinglish में उपलब्ध',
  contentsLabel: 'Policy के सभी हिस्से',
  contentsTitle: 'इस Policy में क्या है',
  metadataLabels: [
    'जगह',
    'लागू होने की तारीख',
    'किराया देने वाला व्यवसाय',
    'Registered Address',
    'संपर्क',
  ],
  reviewNote:
    'वेबसाइट पर वास्तविक इस्तेमाल से पहले तीनों versions किसी भारतीय कानूनी विशेषज्ञ से check करवाएँ। अभी इन्हें कानूनी रूप से verified न मानें।',
  sections: [
    {
      id: 'rental-policy-1',
      title: 'इस Policy के बारे में',
      paragraphs: [
        'RideRent इंदौर, मध्य प्रदेश में खुद चलाने के लिए बाइक, स्कूटर और कार Booking करने की सुविधा देता है। गाड़ी मिलना उसकी availability और सभी जरूरी कानूनी permissions पर निर्भर करता है।',
        'यह Rental Policy Booking, Payment, गाड़ी लेने, उसे कैसे इस्तेमाल कर सकते हैं, समय बढ़ाने, cancellation, गाड़ी वापस करने और ग्राहक की जिम्मेदारियों पर लागू होती है।',
        'सभी rentals पर Motor Vehicles Act, 1988 (वाहनों से जुड़ा कानून), लागू केंद्रीय rental योजनाएँ, मध्य प्रदेश के transport नियम और संबंधित consumer-protection कानून लागू होते हैं।',
      ],
    },
    {
      id: 'rental-policy-2',
      title: 'कौन गाड़ी किराये पर ले सकता है',
      paragraphs: [
        'आपकी उम्र कम से कम 18 साल होनी चाहिए। आपके पास चुनी हुई गाड़ी की category को चलाने की अनुमति देने वाला सही और वैध Driving Licence (DL) होना जरूरी है।',
        'Insurance या गाड़ी किराये पर देने की जरूरी व्यवस्थाओं के कारण उम्र या driving experience की अतिरिक्त शर्तें हो सकती हैं। इनका उचित कारण होना चाहिए और ये Booking से पहले बताई जाएँगी।',
        'RideRent की self-drive rental के लिए सिर्फ Learner’s Licence स्वीकार नहीं किया जाता।',
        'गाड़ी देने से पहले RideRent आपकी पहचान, गाड़ी चलाने की अनुमति और contact details check कर सकता है।',
      ],
    },
    {
      id: 'rental-policy-3',
      title: 'Booking और किराये का समय',
      paragraphs: [
        'आप वेबसाइट या RideRent के अधिकृत प्रतिनिधि से घंटे के हिसाब से Booking का अनुरोध कर सकते हैं।',
        'Booking तभी confirm होती है जब RideRent उसे स्वीकार करता है।',
        'Confirmed Booking में गाड़ी, किराये का समय, pickup और return की जगह, charges और लागू शर्तें बताई जाएँगी।',
        'किराये का समय बढ़ाने के लिए RideRent की मंजूरी जरूरी है। इसके लिए आपको बताए गए अतिरिक्त charges लग सकते हैं।',
      ],
    },
    {
      id: 'rental-policy-4',
      title: 'Rental Charges और Security Deposit',
      paragraphs: [
        'Booking confirm होने से पहले rental rates, taxes, Security Deposit और लागू extra charges बताए जाएँगे।',
        'वापस मिलने वाला Security Deposit बताई गई समय-सीमा में लौटाया जाएगा। इसमें से सिर्फ कानून के अनुसार और रिकॉर्ड से साबित होने वाली कटौती की जा सकती है।',
        'RideRent हर कटौती का अलग-अलग विवरण देगा। बिना उचित आधार के मनमाने charges नहीं लगाए जाएँगे।',
      ],
    },
    {
      id: 'rental-policy-5',
      title: 'गाड़ी लेना और वापस करना',
      paragraphs: [
        'गाड़ी इंदौर की तय rental location से लेनी और वहीं वापस करनी होगी। दूसरी व्यवस्था तभी मान्य होगी जब उसकी साफ तौर पर मंजूरी दी गई हो।',
        'गाड़ी देते और लौटाते समय उसकी condition, fuel या battery level, odometer (कितने किलोमीटर चली है) की reading और साथ दिए गए सामान का रिकॉर्ड बनाना चाहिए।',
        'यात्रा शुरू करने से पहले ऐसा कोई Damage दिखे जो रिकॉर्ड में नहीं है, तो उसकी जानकारी देनी होगी।',
      ],
    },
    {
      id: 'rental-policy-6',
      title: 'गाड़ी का सही इस्तेमाल',
      paragraphs: [
        'गाड़ी सिर्फ वही व्यक्ति चला सकता है जिसे अनुमति दी गई हो और जिसके पास उस गाड़ी का सही Driving Licence हो।',
        'Helmet और seat belt के नियमों सहित सभी लागू traffic laws का पालन करना होगा।',
        'शराब या नशीली चीजों के असर में गाड़ी चलाना, racing, बिना अनुमति commercial use और गैरकानूनी कामों के लिए गाड़ी इस्तेमाल करना मना है।',
        'आप किन इलाकों में गाड़ी ले जा सकते हैं, यह Booking confirmation में बताया जाएगा।',
        'मध्य प्रदेश से बाहर जाने के लिए पहले मंजूरी लेनी होगी। लागू permits, taxes, Insurance conditions और दूसरी कानूनी जरूरतों का पालन भी करना होगा।',
      ],
    },
    {
      id: 'rental-policy-7',
      title: 'Late Return',
      paragraphs: [
        'गाड़ी सहमत समय तक वापस करनी होगी।',
        'Late Return पर Booking के समय बताई गई rates के हिसाब से extra rental charges लग सकते हैं।',
        'किसी नुकसान या Damage के लिए अतिरिक्त रकम का दावा उचित होना चाहिए, रिकॉर्ड से साबित होना चाहिए और कानून के अनुसार वसूल किया जा सकने वाला होना चाहिए।',
      ],
    },
    {
      id: 'rental-policy-8',
      title: 'Accident, चोरी और Damage',
      paragraphs: [
        'Accident, चोरी, गाड़ी खराब होने या बड़े Damage की जानकारी तुरंत RideRent को देनी होगी।',
        'जहाँ जरूरी हो, पुलिस और संबंधित emergency services को भी जानकारी देनी होगी।',
        'नुकसान और उसके लिए कौन जिम्मेदार है, यह घटना की परिस्थितियों, लागू कानून, rental agreement (किराये की शर्तों) और Insurance cover के अनुसार तय होगा।',
        'किराये के दौरान हुई हर mechanical खराबी या घटना के लिए ग्राहक को अपने-आप जिम्मेदार नहीं माना जाएगा।',
      ],
    },
    {
      id: 'rental-policy-9',
      title: 'Insurance',
      paragraphs: [
        'RideRent गाड़ी तभी उपलब्ध कराएगा जब जरूरी registration, permissions और Insurance उस तरह की rental service की अनुमति देते हों।',
        'गाड़ी देने से पहले बताया जाएगा कि Insurance में क्या cover है, क्या cover नहीं है और claim में ग्राहक को अपने हिस्से की कितनी रकम देनी पड़ सकती है।',
        'Insurance claim पर Insurance company की policy conditions और लागू कानून लागू होंगे।',
      ],
    },
    {
      id: 'rental-policy-10',
      title: 'Cancellation और Refund',
      paragraphs: [
        'Payment से पहले cancellation की समय-सारणी, लागू fees और Refund की समय-सीमा दिखाई जाएगी।',
        'अगर RideRent confirmed गाड़ी नहीं दे पाता और ग्राहक दूसरी उपयुक्त गाड़ी स्वीकार नहीं करता, तो न मिल पाने वाली rental service के लिए दी गई रकम वापस की जाएगी।',
        'Refund में कोई कटौती की जाए, तो वह लागू consumer-protection कानूनों के अनुसार होनी चाहिए।',
      ],
    },
    {
      id: 'rental-policy-11',
      title: 'Traffic rules तोड़ने की जिम्मेदारी',
      paragraphs: [
        'किराये के दौरान ग्राहक के अपने व्यवहार से हुए traffic violations की जिम्मेदारी ग्राहक की होगी, जितनी कानून अनुमति देता है।',
        'कानून के तहत जरूरी होने पर RideRent संबंधित rental information उस मामले में अधिकार रखने वाले अधिकारियों को दे सकता है।',
      ],
    },
    {
      id: 'rental-policy-12',
      title: 'आपकी Personal Information',
      paragraphs: [
        'RideRent Booking, पहचान की जाँच, Driving Licence check, Payment और कानून का पालन करने के लिए जरूरी ग्राहक जानकारी ले सकता है।',
        'Personal Information का इस्तेमाल और उसे संभालना लागू भारतीय data-protection कानून और RideRent की Privacy Policy के अनुसार होगा।',
      ],
    },
    {
      id: 'rental-policy-13',
      title: 'शिकायत और विवाद',
      paragraphs: [
        'ग्राहक वेबसाइट पर दिए गए support details से RideRent से संपर्क कर सकते हैं।',
        'इस Policy पर लागू भारतीय कानून और मध्य प्रदेश की संबंधित कानूनी जरूरतें लागू होती हैं।',
        'इस Policy की कोई बात ग्राहक को कानून से मिले अधिकारों या संबंधित अदालतों और consumer authorities से मिलने वाली मदद का हक कम नहीं करती।',
      ],
    },
    {
      id: 'rental-policy-14',
      title: 'Contact Details',
      paragraphs: [],
      details: [
        ['व्यवसाय', 'RideRent — [Registered Business Name भरें]'],
        ['पता', '[इंदौर का पूरा पता भरें]'],
        ['फ़ोन', '[Customer Support Number भरें]'],
        ['ईमेल', '[Official Email भरें]'],
        ['काम का समय', '[Operating Hours भरें]'],
      ],
    },
  ],
  closing:
    'यह Policy, confirmed Booking की शर्तें और गाड़ी सौंपते समय का agreement मिलकर किराये के दस्तावेज़ बनते हैं। किसी शर्त और कानून की जरूरी बात में फर्क हो, तो कानून की जरूरी बात लागू होगी।',
};
const easyHinglish = {
  lang: 'hi-Latn',
  title: 'RideRent — Gaadi Rent Par Lene Ki Policy',
  location: 'Indore, Madhya Pradesh, India',
  operator: '[Registered Business Name bharein]',
  registeredAddress: '[Indore ka poora business address bharein]',
  contact: '[Phone aur Email bharein]',
  eyebrow: 'RENTAL KI CONDITIONS · INDORE',
  languageLabel: 'Language chunein',
  availableNote: 'English, Simple Hindi aur Easy Hinglish mein available',
  contentsLabel: 'Policy ke sabhi sections',
  contentsTitle: 'Is Policy mein kya hai',
  metadataLabels: [
    'Location',
    'Lagu hone ki date',
    'Rental dene wala business',
    'Registered Address',
    'Contact',
  ],
  reviewNote:
    'Website par actual use se pehle teeno versions kisi Indian legal professional se check karwayein. Abhi inhe legally verified na maanein.',
  sections: [
    {
      id: 'rental-policy-1',
      title: 'Is Policy ke baare mein',
      paragraphs: [
        'RideRent Indore, Madhya Pradesh mein khud chalane ke liye bikes, scooters aur cars book karne ka platform deta hai. Gaadi milna uski availability aur sabhi zaroori legal permissions par depend karta hai.',
        'Yeh Rental Policy Booking, Payment, gaadi lene, permitted use, rental time badhane, cancellation, return aur customer ki zimmedariyon par lagu hoti hai.',
        'Sabhi rentals par Motor Vehicles Act, 1988 (vehicles se juda kanoon), lagu central rental schemes, Madhya Pradesh ke transport requirements aur sambandhit consumer-protection laws lagu hote hain.',
      ],
    },
    {
      id: 'rental-policy-2',
      title: 'Kaun gaadi rent par le sakta hai',
      paragraphs: [
        'Aapki age kam se kam 18 saal honi chahiye. Aapke paas selected vehicle category chalane ki permission dene wala sahi aur valid Driving Licence (DL) hona zaroori hai.',
        'Insurance ya rental chalane ki zaroori arrangements ki wajah se age ya driving experience ki extra conditions ho sakti hain. Inka sahi reason hona chahiye aur yeh Booking se pehle batayi jayengi.',
        'RideRent self-drive rental ke liye sirf Learner’s Licence accept nahi kiya jata.',
        'Gaadi dene se pehle RideRent aapki identity, gaadi chalane ki permission aur contact details verify kar sakta hai.',
      ],
    },
    {
      id: 'rental-policy-3',
      title: 'Booking aur rental time',
      paragraphs: [
        'Aap website ya RideRent ke authorised representative ke through hourly Booking request kar sakte hain.',
        'Booking tabhi confirm hoti hai jab RideRent use accept karta hai.',
        'Confirmed Booking mein vehicle, rental time, pickup aur return locations, charges aur lagu conditions batayi jayengi.',
        'Rental time badhane ke liye RideRent ki approval zaroori hai. Iske liye aapko bataye gaye extra charges lag sakte hain.',
      ],
    },
    {
      id: 'rental-policy-4',
      title: 'Rental Charges aur Security Deposit',
      paragraphs: [
        'Booking confirm hone se pehle rental rates, taxes, Security Deposit aur lagu extra charges bataye jayenge.',
        'Wapas milne wala Security Deposit bataye gaye time ke andar return hoga. Ismein se sirf kanoon ke mutabik aur records se prove hone wali deductions ki ja sakti hain.',
        'RideRent har deduction ka alag-alag detail dega. Bina sahi wajah ke manmaane charges nahi lagaye jayenge.',
      ],
    },
    {
      id: 'rental-policy-5',
      title: 'Gaadi lena aur wapas karna',
      paragraphs: [
        'Gaadi Indore ki tay rental location se leni aur wahin wapas karni hogi. Dusri arrangement tabhi valid hogi jab uski saaf taur par approval di gayi ho.',
        'Gaadi dete aur return karte waqt uski condition, fuel ya battery level, odometer (kitne kilometre chali hai) reading aur saath diye gaye accessories ka record banana chahiye.',
        'Journey shuru karne se pehle aisa koi Damage dikhe jo record mein nahi hai, to uski jaankari deni hogi.',
      ],
    },
    {
      id: 'rental-policy-6',
      title: 'Gaadi ka permitted use',
      paragraphs: [
        'Gaadi sirf wahi person chala sakta hai jise permission di gayi ho aur jiske paas us vehicle ke liye sahi Driving Licence ho.',
        'Helmet aur seat belt ke rules ke saath sabhi lagu traffic laws follow karne honge.',
        'Alcohol ya drugs ke asar mein driving, racing, bina permission commercial use aur illegal activities ke liye vehicle use karna mana hai.',
        'Aap kin areas mein gaadi le ja sakte hain, yeh Booking confirmation mein bataya jayega.',
        'Madhya Pradesh ke bahar travel karne ke liye pehle approval leni hogi. Lagu permits, taxes, Insurance conditions aur dusri legal requirements bhi follow karni hongi.',
      ],
    },
    {
      id: 'rental-policy-7',
      title: 'Late Return',
      paragraphs: [
        'Gaadi agreed time tak return karni hogi.',
        'Late Return par Booking ke waqt bataye gaye rates ke hisaab se extra rental charges lag sakte hain.',
        'Kisi loss ya Damage ke liye extra amount ka claim reasonable hona chahiye, records se prove hona chahiye aur kanoon ke mutabik recover kiya ja sakne wala hona chahiye.',
      ],
    },
    {
      id: 'rental-policy-8',
      title: 'Accident, theft aur Damage',
      paragraphs: [
        'Accident, theft, gaadi kharab hone ya bade Damage ki jaankari turant RideRent ko deni hogi.',
        'Jahan zaroori ho, police aur sambandhit emergency services ko bhi inform karna hoga.',
        'Nuksaan aur uske liye kaun zimmedar hai, yeh incident ki circumstances, lagu kanoon, rental agreement (kiraye ki conditions) aur Insurance cover ke hisaab se tay hoga.',
        'Rental ke dauran hui har mechanical problem ya incident ke liye customer ko apne-aap zimmedar nahi maana jayega.',
      ],
    },
    {
      id: 'rental-policy-9',
      title: 'Insurance',
      paragraphs: [
        'RideRent gaadi tabhi available karayega jab zaroori registration, permissions aur Insurance us tarah ki rental service ki ijazat dete hon.',
        'Gaadi dene se pehle bataya jayega ki Insurance mein kya cover hai, kya cover nahi hai aur claim mein customer ko apne hisse ka kitna amount dena pad sakta hai.',
        'Insurance claim par insurer ki policy conditions aur lagu kanoon apply honge.',
      ],
    },
    {
      id: 'rental-policy-10',
      title: 'Cancellation aur Refund',
      paragraphs: [
        'Payment se pehle cancellation schedule, lagu fees aur Refund timelines dikhayi jayengi.',
        'Agar RideRent confirmed gaadi nahi de pata aur customer suitable alternative gaadi accept nahi karta, to na mil paane wali rental service ke liye diya gaya amount refund kiya jayega.',
        'Refund mein koi deduction ho, to woh lagu consumer-protection laws ke mutabik honi chahiye.',
      ],
    },
    {
      id: 'rental-policy-11',
      title: 'Traffic violations ki zimmedari',
      paragraphs: [
        'Rental ke dauran customer ke apne conduct ki wajah se hue traffic violations ki zimmedari customer ki hogi, jitni kanoon allow karta hai.',
        'Kanoon ke tahat zaroori hone par RideRent sambandhit rental information us mamle mein authority rakhne wale officials ko de sakta hai.',
      ],
    },
    {
      id: 'rental-policy-12',
      title: 'Aapki Personal Information',
      paragraphs: [
        'RideRent Booking, identity verification, Driving Licence checks, Payment aur kanoon follow karne ke liye zaroori customer information le sakta hai.',
        'Personal Information ka use aur use handle karna lagu Indian data-protection law aur RideRent ki Privacy Policy ke mutabik hoga.',
      ],
    },
    {
      id: 'rental-policy-13',
      title: 'Complaints aur disputes',
      paragraphs: [
        'Customers website par diye gaye support details se RideRent se contact kar sakte hain.',
        'Is Policy par lagu Indian laws aur Madhya Pradesh ki sambandhit legal requirements apply hoti hain.',
        'Is Policy ki koi baat customer ko kanoon se mile rights ya sambandhit courts aur consumer authorities se milne wali madad ka haq kam nahi karti.',
      ],
    },
    {
      id: 'rental-policy-14',
      title: 'Contact Details',
      paragraphs: [],
      details: [
        ['Business', 'RideRent — [Registered Business Name bharein]'],
        ['Address', '[Indore ka poora address bharein]'],
        ['Phone', '[Customer Support Number bharein]'],
        ['Email', '[Official Email bharein]'],
        ['Business Hours', '[Operating Hours bharein]'],
      ],
    },
  ],
  closing:
    'Yeh Policy, confirmed Booking ki conditions aur gaadi handover karte waqt ka agreement milkar rental documents bante hain. Kisi condition aur kanoon ki zaroori baat mein farq ho, to kanoon ki zaroori baat lagu hogi.',
};
export const rentalPolicyTranslations = {
  en: {
    ...rentalPolicy,
    lang: 'en',
    eyebrow: 'RENTAL TERMS · INDORE',
    languageLabel: 'Select Language',
    availableNote: 'Available in English, Simple Hindi and Easy Hinglish',
    contentsLabel: 'Policy contents',
    contentsTitle: 'In this policy',
    metadataLabels: ['Location', 'Effective Date', 'Operator', 'Registered Address', 'Contact'],
    reviewNote:
      'All three versions require review by an Indian legal professional before production publication. They are not legally verified.',
    sections: rentalPolicy.sections.map((section, index) => ({
      ...section,
      id: `rental-policy-${index + 1}`,
    })),
  },
  hi: {
    ...simpleHindi,
    effectiveDate:
      rentalPolicy.effectiveDate === '[DD Month YYYY]'
        ? '[दिन, महीना और साल भरें]'
        : rentalPolicy.effectiveDate,
  },
  hinglish: {
    ...easyHinglish,
    effectiveDate:
      rentalPolicy.effectiveDate === '[DD Month YYYY]'
        ? '[Din, mahina aur saal bharein]'
        : rentalPolicy.effectiveDate,
  },
};
