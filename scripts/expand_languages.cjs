const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/utils/languages.ts');
const content = fs.readFileSync(targetPath, 'utf8');

// The new languages to add:
const NEW_LANGUAGES = [
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', region: 'Europe' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', region: 'Africa' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲', region: 'Asia' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', region: 'Asia' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿', region: 'Asia' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'Europe' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾', region: 'Europe' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', region: 'Europe' },
  { code: 'my', name: 'Burmese / Myanmar', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲', region: 'Asia' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Sinugboanon', flag: '🇵🇭', region: 'Asia' },
  { code: 'prs', name: 'Dari (Afghan Persian)', nativeName: 'دری', flag: '🇦🇫', region: 'Asia' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌐', region: 'Global' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', region: 'Europe' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti', flag: '🇫🇯', region: 'Oceania' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸', region: 'Europe' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', region: 'Asia' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ', flag: '🇵🇾', region: 'Americas' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹', region: 'Americas' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸', region: 'Oceania' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', region: 'Europe' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', region: 'Europe' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩', region: 'Asia' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', region: 'Asia' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', region: 'Asia' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼', region: 'Africa' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi', flag: '🇧🇮', region: 'Africa' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî / کوردی', flag: '🇮🇶', region: 'Middle East' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬', region: 'Asia' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', flag: '🇱🇦', region: 'Asia' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🇻🇦', region: 'Global' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', region: 'Europe' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', region: 'Africa' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', region: 'Europe' },
  { code: 'lg', name: 'Luganda', nativeName: 'Oluganda', flag: '🇺🇬', region: 'Africa' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺', region: 'Europe' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', region: 'Europe' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬', region: 'Africa' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', region: 'Europe' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿', region: 'Oceania' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳', region: 'Asia' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', region: 'Asia' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'Asia' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹', region: 'Africa' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', region: 'Asia' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', flag: '🇵🇪', region: 'Americas' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', flag: '🇼🇸', region: 'Oceania' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', region: 'Europe' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸', region: 'Africa' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼', region: 'Africa' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', region: 'Asia' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', region: 'Europe' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', region: 'Africa' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩', region: 'Asia' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯', region: 'Asia' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད་', flag: '🇨🇳', region: 'Asia' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷', region: 'Africa' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Fakatonga', flag: '🇹🇴', region: 'Oceania' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', flag: '🇧🇼', region: 'Africa' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲', region: 'Asia' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿', region: 'Asia' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🇬🇧', region: 'Europe' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳', region: 'Africa' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', region: 'Africa' },
];

// Helper to generate translated base terms for each language
const TEMPLATES = {
  sq: { chats: 'Bisedat', status: 'Statusi', calls: 'Telefonatat', contacts: 'Kontaktet', communities: 'Komunitetet', settings: 'Cilësimet', typeMessage: 'Shkruaj një mesazh...', online: 'Në linjë', offline: 'Jashtë linje', voiceCall: 'Telefonatë me zë', videoCall: 'Video telefonatë', endCall: 'Mbyll telefonatën', answerCall: 'Përgjigju', declineCall: 'Refuzo', search: 'Kërko biseda...' },
  am: { chats: 'ውይይቶች', status: 'ሁኔታ', calls: 'ጥሪዎች', contacts: 'ዕውቂያዎች', communities: 'ማህበረሰቦች', settings: 'ቅንብሮች', typeMessage: 'መልእክት ጻፍ...', online: 'ኦንላይን', offline: 'ከመስመር ውጭ', voiceCall: 'የድምፅ ጥሪ', videoCall: 'የቪዲዮ ጥሪ', endCall: 'ጥሪ አብቃ', answerCall: 'መልስ', declineCall: 'አትቀበል', search: 'ውይይቶችን ፈልግ...' },
  hy: { chats: 'Զրույցներ', status: 'Կարգավիճակ', calls: 'Զանգեր', contacts: 'Կոնտակտներ', communities: 'Համայնքներ', settings: 'Կարգավորումներ', typeMessage: 'Գրեք հաղորդագրություն...', online: 'Առցանց', offline: 'Անցանց', voiceCall: 'Ձայնային զանգ', videoCall: 'Տեսազանգ', endCall: 'Ավարտել զանգը', answerCall: 'Պատասխանել', declineCall: 'Մերժել', search: 'Որոնել զրույցներ...' },
  as: { chats: 'চেটসমূহ', status: 'স্থিতি', calls: 'কলসমূহ', contacts: 'যোগাযোগ', communities: 'সম্প্ৰদায়সমূহ', settings: 'ছেটিংছ', typeMessage: 'বাৰ্তা লিখক...', online: 'অনলাইন', offline: 'অফলাইন', voiceCall: 'ভইচ কল', videoCall: 'ভিডিঅ\' কল', endCall: 'কল সমাপ্ত কৰক', answerCall: 'উত্তৰ দিয়ক', declineCall: 'প্ৰত্যাখ্যান কৰক', search: 'অনুসন্ধান কৰক...' },
  az: { chats: 'Söhbətlər', status: 'Status', calls: 'Zənglər', contacts: 'Əlaqələr', communities: 'İcmalar', settings: 'Tənzimləmələr', typeMessage: 'Mesaj yazın...', online: 'Onlayn', offline: 'Oflayn', voiceCall: 'Səsli zəng', videoCall: 'Video zəng', endCall: 'Zəngi bitir', answerCall: 'Cavab ver', declineCall: 'Rədd et', search: 'Söhbətlərdə axtar...' },
  eu: { chats: 'Txatak', status: 'Egoera', calls: 'Deiak', contacts: 'Kontaktuak', communities: 'Komunitateak', settings: 'Ezarpenak', typeMessage: 'Idatzi mezu bat...', online: 'Konektatuta', offline: 'Deskonektatuta', voiceCall: 'Ahots-deia', videoCall: 'Bideo-deia', endCall: 'Amaitu deia', answerCall: 'Erantzun', declineCall: 'Ukatu', search: 'Bilatu txatak...' },
  be: { chats: 'Чаты', status: 'Статус', calls: 'Званкі', contacts: 'Кантакты', communities: 'Супольнасці', settings: 'Налады', typeMessage: 'Напішыце паведамленне...', online: 'У сетцы', offline: 'Не ў сетцы', voiceCall: 'Галасавы званок', videoCall: 'Відэазванок', endCall: 'Завяршыць званок', answerCall: 'Адказаць', declineCall: 'Адхіліць', search: 'Пошук па чатах...' },
  bs: { chats: 'Razgovori', status: 'Status', calls: 'Pozivi', contacts: 'Kontakti', communities: 'Zajednice', settings: 'Postavke', typeMessage: 'Upišite poruku...', online: 'Na mreži', offline: 'Van mreže', voiceCall: 'Glasovni poziv', videoCall: 'Videopoziv', endCall: 'Završi poziv', answerCall: 'Javi se', declineCall: 'Odbij', search: 'Pretraži poruke...' },
  my: { chats: 'စကားပြောခန်းများ', status: 'အခြေအနေ', calls: 'ခေါ်ဆိုမှုများ', contacts: 'အဆက်အသွယ်များ', communities: 'အသိုက်အဝန်းများ', settings: 'ဆက်တင်များ', typeMessage: 'မက်ဆေ့ခ်ျရေးပါ...', online: 'လိုင်းပေါ်တွင်', offline: 'လိုင်းပိတ်', voiceCall: 'အသံဖြင့်ခေါ်ဆိုမှု', videoCall: 'ဗီဒီယိုခေါ်ဆိုမှု', endCall: 'ခေါ်ဆိုမှုရပ်စဲရန်', answerCall: 'လက်ခံရန်', declineCall: 'ငြင်းပယ်ရန်', search: 'ရှာဖွေပါ...' },
  ceb: { chats: 'Mga Panagsultianay', status: 'Kahimtang', calls: 'Mga Tawag', contacts: 'Mga Kontak', communities: 'Mga Komunidad', settings: 'Mga Setting', typeMessage: 'Pagsulat og mensahe...', online: 'Online', offline: 'Offline', voiceCall: 'Tawag sa Tingog', videoCall: 'Video Tawag', endCall: 'Tapusa ang Tawag', answerCall: 'Tubaga', declineCall: 'Balibari', search: 'Pangita...' },
  prs: { chats: 'گفتگوها', status: 'وضعیت', calls: 'تماس‌ها', contacts: 'مخاطبین', communities: 'جامعه‌ها', settings: 'تنظیمات', typeMessage: 'پیام بنویسید...', online: 'آنلاین', offline: 'آفلاین', voiceCall: 'تماس صوتی', videoCall: 'تماس تصویری', endCall: 'پایان تماس', answerCall: 'پاسخ', declineCall: 'رد تماس', search: 'جستجو...' },
  eo: { chats: 'Babiladoj', status: 'Stato', calls: 'Vokoj', contacts: 'Kontaktoj', communities: 'Komunumoj', settings: 'Agordoj', typeMessage: 'Tajpu mesaĝon...', online: 'Enreta', offline: 'Senreta', voiceCall: 'Voĉa voko', videoCall: 'Videa voko', endCall: 'Fini vokon', answerCall: 'Respondi', declineCall: 'Rifuzi', search: 'Serĉi babiladojn...' },
  et: { chats: 'Vestlused', status: 'Olek', calls: 'Kõned', contacts: 'Kontaktid', communities: 'Kogukonnad', settings: 'Seaded', typeMessage: 'Kirjuta sõnum...', online: 'Võrgus', offline: 'Võrgust väljas', voiceCall: 'Häälekõne', videoCall: 'Videokõne', endCall: 'Lõpeta kõne', answerCall: 'Vasta', declineCall: 'Keeldu', search: 'Otsi vestlusi...' },
  fj: { chats: 'Veiwali', status: 'Tuvatuva', calls: 'Qiri', contacts: 'Tawake', communities: 'Veitikotiko', settings: 'Veika e vakatulewataki', typeMessage: 'Vola e dua na itukutuku...', online: 'Tiko e na monalivaliva', offline: 'Sega ni tiko', voiceCall: 'Qiri domo', videoCall: 'Qiri vitiyo', endCall: 'Tiniraka na qiri', answerCall: 'Sauma', declineCall: 'Bilotaka', search: 'Vaqara...' },
  gl: { chats: 'Conversas', status: 'Estado', calls: 'Chamadas', contacts: 'Contactos', communities: 'Comunidades', settings: 'Axustes', typeMessage: 'Escribe unha mensaxe...', online: 'En liña', offline: 'Fóra de liña', voiceCall: 'Chamada de voz', videoCall: 'Videochamada', endCall: 'Finalizar chamada', answerCall: 'Responder', declineCall: 'Rexeitar', search: 'Buscar conversas...' },
  ka: { chats: 'ჩათები', status: 'სტატუსი', calls: 'ზარები', contacts: 'კონტაქტები', communities: 'საზოგადოებები', settings: 'პარამეტრები', typeMessage: 'დაწერეთ შეტყობინება...', online: 'ონლაინ', offline: 'ხაზგარეშე', voiceCall: 'ხმოვანი ზარი', videoCall: 'ვიდეოზარი', endCall: 'ზარის დასრულება', answerCall: 'პასუხი', declineCall: 'უარყოფა', search: 'ძიება...' },
  gn: { chats: 'Ñomongeta', status: 'Tekotee', calls: 'Ñehenói', contacts: 'Tapicha', communities: 'Tekoha', settings: 'Ñembosako\'i', typeMessage: 'Haikatu marandu...', online: 'Oĩva', offline: 'Ndaipóri', voiceCall: 'Ñehenói ñe\'ẽ rehegua', videoCall: 'Ta\'angambyry ñehenói', endCall: 'Mopa\'ũ ñehenói', answerCall: 'Mbohovái', declineCall: 'Mboyke', search: 'Heka...' },
  ht: { chats: 'Diskisyon', status: 'Estati', calls: 'Apèl', contacts: 'Kontak', communities: 'Kominote', settings: 'Paramèt', typeMessage: 'Ekri yon mesaj...', online: 'An liy', offline: 'Pa an liy', voiceCall: 'Apèl vokal', videoCall: 'Apèl videyo', endCall: 'Fini apèl', answerCall: 'Reponn', declineCall: 'Refize', search: 'Chèche diskisyon...' },
  haw: { chats: 'Nā kamaʻilio', status: 'Kūlana', calls: 'Nā kāhea', contacts: 'Nā pilina', communities: 'Nā kaiaulu', settings: 'Nā koho hoʻonohonoho', typeMessage: 'Kākau i memo...', online: 'Ma ka pūnaewele', offline: 'Kūwaho', voiceCall: 'Kāhea leo', videoCall: 'Kāhea wikiō', endCall: 'Hoʻopau kāhea', answerCall: 'Pane', declineCall: 'Hōʻole', search: 'Huli...' },
  is: { chats: 'Spjöll', status: 'Staða', calls: 'Símtöl', contacts: 'Tengiliðir', communities: 'Samfélög', settings: 'Stillingar', typeMessage: 'Skrifaðu skilaboð...', online: 'Tengdur', offline: 'Ótengdur', voiceCall: 'Raddsamtal', videoCall: 'Myndsamtal', endCall: 'Ljúka símtali', answerCall: 'Svara', declineCall: 'Hafna', search: 'Leita í spjöllum...' },
  ga: { chats: 'Comhráite', status: 'Stádas', calls: 'Glaonna', contacts: 'Teagmhálacha', communities: 'Pobail', settings: 'Socruithe', typeMessage: 'Scríobh teachtaireacht...', online: 'Ar líne', offline: 'As líne', voiceCall: 'Glao gutha', videoCall: 'Físglao', endCall: 'Cuir deireadh le glao', answerCall: 'Freagair', declineCall: 'Diúltaigh', search: 'Cuardaigh comhráite...' },
  jv: { chats: 'Obrolan', status: 'Kahanan', calls: 'Telpon', contacts: 'Kontak', communities: 'Komunitas', settings: 'Setelan', typeMessage: 'Tulis pesen...', online: 'Online', offline: 'Offline', voiceCall: 'Telpon Swara', videoCall: 'Telpon Video', endCall: 'Mungkasi Telpon', answerCall: 'Wangsulana', declineCall: 'Tolak', search: 'Golek obrolan...' },
  kk: { chats: 'Чаттар', status: 'Күй', calls: 'Қоңыраулар', contacts: 'Контактілер', communities: 'Қоғамдастықтар', settings: 'Баптаулар', typeMessage: 'Хабарлама жазу...', online: 'Желіде', offline: 'Желіде емес', voiceCall: 'Дауыстық қоңырау', videoCall: 'Бейнеқоңырау', endCall: 'Қоңырауды аяқтау', answerCall: 'Жауап беру', declineCall: 'Бас тарту', search: 'Іздеу...' },
  km: { chats: 'ការសន្ទនា', status: 'ស្ថានភាព', calls: 'ការហៅ', contacts: 'ទំនាក់ទំនង', communities: 'សហគមន៍', settings: 'ការកំណត់', typeMessage: 'វាយសារ...', online: 'នៅលើបណ្តាញ', offline: 'ក្រៅបណ្តាញ', voiceCall: 'ការហៅជាសំឡេង', videoCall: 'ការហៅជាវីដេអូ', endCall: 'បញ្ចប់ការហៅ', answerCall: 'ឆ្លើយ', declineCall: 'បដិសេធ', search: 'ស្វែងរក...' },
  rw: { chats: 'Ubutumwa', status: 'Imiterere', calls: 'Guhamagara', contacts: 'Abo mwiranga', communities: 'Imiryango', settings: 'Ibyo guhitamo', typeMessage: 'Andika ubutumwa...', online: 'Kuri murandasi', offline: 'Ntabwo ari kuri murandasi', voiceCall: 'Guhamagara mu ijwi', videoCall: 'Guhamagara mu mashusho', endCall: 'Kureka guhamagara', answerCall: 'Kwitaba', declineCall: 'Kwangira', search: 'Shakisha...' },
  rn: { chats: 'Ikiyago', status: 'Uko wifashe', calls: 'Amahamagara', contacts: 'Abo muziranye', communities: 'Amashirahamwe', settings: 'Ibihindurwa', typeMessage: 'Andika ubutumwa...', online: 'Kuri interineti', offline: 'Nta murongo', voiceCall: 'Ihamagara ry\'ijwi', videoCall: 'Ihamagara ry\'amasanamu', endCall: 'Guhagarika ihamagara', answerCall: 'Kwitaba', declineCall: 'Kwangira', search: 'Rondera...' },
  ku: { chats: 'Peyam', status: 'Rewş', calls: 'Bangkirin', contacts: 'Têkilî', communities: 'Civak', settings: 'Mîheng', typeMessage: 'Peyamek binivîse...', online: 'Serhêl', offline: 'Derhêl', voiceCall: 'Banga dengî', videoCall: 'Vîdyobang', endCall: 'Bangê biqedîne', answerCall: 'Bersiv bide', declineCall: 'Red bike', search: 'Lêgerîn...' },
  ky: { chats: 'Чаттар', status: 'Абал', calls: 'Чалуулар', contacts: 'Байланыштар', communities: 'Коомдоштуктар', settings: 'Орнотуулар', typeMessage: 'Билдирүү жазуу...', online: 'Тармакта', offline: 'Тармактан тышкары', voiceCall: 'Үн чалуу', videoCall: 'Видео чалуу', endCall: 'Чалууну бүтүрүү', answerCall: 'Жооп берүү', declineCall: 'Четке кагуу', search: 'Издөө...' },
  lo: { chats: 'ການສົນທະນາ', status: 'ສະຖານະ', calls: 'ການໂທ', contacts: 'ລາຍຊື່ຜູ້ຕິດຕໍ່', communities: 'ຊຸມຊົນ', settings: 'ການຕັ້ງຄ່າ', typeMessage: 'ພິມຂໍ້ຄວາມ...', online: 'ອອນລາຍ', offline: 'ອອບລາຍ', voiceCall: 'ການໂທສຽງ', videoCall: 'ການໂທວິດີໂອ', endCall: 'ວາງສາຍ', answerCall: 'ຮັບສາຍ', declineCall: 'ປະຕິເສດ', search: 'ຄົ້ນຫາ...' },
  la: { chats: 'Colloquia', status: 'Status', calls: 'Vocationes', contacts: 'Contactus', communities: 'Communitates', settings: 'Configurationes', typeMessage: 'Scribe nuntium...', online: 'In linea', offline: 'Extra lineam', voiceCall: 'Vocatio vocis', videoCall: 'Vocatio videndi', endCall: 'Finire vocationem', answerCall: 'Respondere', declineCall: 'Recusare', search: 'Quaerere...' },
  lv: { chats: 'Tērzēšana', status: 'Statuss', calls: 'Zvani', contacts: 'Kontakti', communities: 'Kopienas', settings: 'Iestatījumi', typeMessage: 'Rakstiet ziņu...', online: 'Tiešsaistē', offline: 'Bezsaistē', voiceCall: 'Balss zvans', videoCall: 'Videozvans', endCall: 'Beigt zvanu', answerCall: 'Atbildēt', declineCall: 'Noraidīt', search: 'Meklēt tērzēšanā...' },
  ln: { chats: 'Masolo', status: 'Ezala', calls: 'Kobianga', contacts: 'Baninga', communities: 'Lisanga', settings: 'Mabongisi', typeMessage: 'Koma likambo...', online: 'Aza na liyangani', offline: 'Aza te', voiceCall: 'Kobianga ya mongongo', videoCall: 'Kobianga ya bilili', endCall: 'Kosilisa kobianga', answerCall: 'Koyanola', declineCall: 'Koboya', search: 'Koluka...' },
  lt: { chats: 'Pokalbiai', status: 'Būsena', calls: 'Skambučiai', contacts: 'Kontaktai', communities: 'Bendruomenės', settings: 'Nustatymai', typeMessage: 'Rašykite žinutę...', online: 'Prisijungęs', offline: 'Atsijungęs', voiceCall: 'Balso skambutis', videoCall: 'Vaizdo skambutis', endCall: 'Baigti skambutį', answerCall: 'Atsiliepti', declineCall: 'Atmesti', search: 'Ieškoti pokalbių...' },
  lg: { chats: 'Emboozi', status: 'Embeera', calls: 'Okukuba essimu', contacts: 'Amannya g\'abantu', communities: 'Ebibiina', settings: 'Enteekateeka', typeMessage: 'Wandiika obubaka...', online: 'Ali ku mutimbagano', offline: 'Taliiko', voiceCall: 'Essimu ey\'eddoboozi', videoCall: 'Essimu ey\'ebifaananyi', endCall: 'Mala essimu', answerCall: 'Ddamu', declineCall: 'Gaana', search: 'Noonya...' },
  lb: { chats: 'Chats', status: 'Statut', calls: 'Uriff', contacts: 'Kontakter', communities: 'Communautéiten', settings: 'Astellungen', typeMessage: 'Schreift e Message...', online: 'Online', offline: 'Offline', voiceCall: 'Stëmmenuruff', videoCall: 'Videouruff', endCall: 'Uruff ofschléissen', answerCall: 'Äntwerten', declineCall: 'Ofleenen', search: 'Sichen...' },
  mk: { chats: 'Разговори', status: 'Статус', calls: 'Повици', contacts: 'Контакти', communities: 'Заедници', settings: 'Поставки', typeMessage: 'Напишете порака...', online: 'На мрежа', offline: 'Надвор од мрежа', voiceCall: 'Гласовен повик', videoCall: 'Видеоповик', endCall: 'Прекини повик', answerCall: 'Одговори', declineCall: 'Одбиј', search: 'Пребарај...' },
  mg: { chats: 'Resaka', status: 'Toetra', calls: 'Antso', contacts: 'Fifandraisana', communities: 'Vondrom-piarahamonina', settings: 'Fikirana', typeMessage: 'Manorata hafatra...', online: 'Mifandray', offline: 'Tsy mifandray', voiceCall: 'Antso an-peo', videoCall: 'Antso an-tsary', endCall: 'Atsaharo ny antso', answerCall: 'Valio', declineCall: 'Lavina', search: 'Hikaroka...' },
  mt: { chats: 'Konversazzjonijiet', status: 'Status', calls: 'Sejħiet', contacts: 'Kuntatti', communities: 'Komunitajiet', settings: 'Settings', typeMessage: 'Ikteb messaġġ...', online: 'Online', offline: 'Offline', voiceCall: 'Sejħa bil-vuċi', videoCall: 'Sejħa bil-vidjo', endCall: 'Temm is-sejħa', answerCall: 'Wieġeb', declineCall: 'Irrifjuta', search: 'Fittex...' },
  mi: { chats: 'Kōrero', status: 'Tūnga', calls: 'Waea', contacts: 'Hoapā', communities: 'Hapori', settings: 'Tautuhinga', typeMessage: 'Tuhia he karere...', online: 'Kei te tuihono', offline: 'Kei waho', voiceCall: 'Waea reo', videoCall: 'Waea ataata', endCall: 'Whakamutu waea', answerCall: 'Whakautu', declineCall: 'Whakakāhore', search: 'Rapua...' },
  mn: { chats: 'Чат', status: 'Төлөв', calls: 'Дуудлага', contacts: 'Харилцагчид', communities: 'Хамт олон', settings: 'Тохиргоо', typeMessage: 'Зурвас бичих...', online: 'Онлайн', offline: 'Офлайн', voiceCall: 'Дуут дуудлага', videoCall: 'Видео дуудлага', endCall: 'Дуудлагыг дуусгах', answerCall: 'Хариулах', declineCall: 'Татгалзах', search: 'Хайх...' },
  ne: { chats: 'कुराकानी', status: 'स्थिति', calls: 'कलहरू', contacts: 'सम्पर्कहरू', communities: 'समुदायहरू', settings: 'सेटिङहरू', typeMessage: 'सन्देश लेख्नुहोस्...', online: 'अनलाइन', offline: 'अफलाइन', voiceCall: 'भ्वाइस कल', videoCall: 'भिडियो कल', endCall: 'कल समाप्त गर्नुहोस्', answerCall: 'उत्तर दिनुहोस्', declineCall: 'अस्वीकार गर्नुहोस्', search: 'खोज्नुहोस्...' },
  or: { chats: 'ଚାଟ୍', status: 'ସ୍ଥିତି', calls: 'କଲ୍', contacts: 'ସମ୍ପର୍କ', communities: 'ସମୁଦାୟ', settings: 'ସେଟିଂସ୍', typeMessage: 'ବାର୍ତ୍ତା ଲେଖନ୍ତୁ...', online: 'ଅନଲାଇନ୍', offline: 'ଅଫଲାଇନ୍', voiceCall: 'ଭଏସ୍ କଲ୍', videoCall: 'ଭିଡିଓ କଲ୍', endCall: 'କଲ୍ ଶେଷ କରନ୍ତୁ', answerCall: 'ଉତ୍ତର ଦିଅନ୍ତୁ', declineCall: 'ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ', search: 'ସନ୍ଧାନ କରନ୍ତୁ...' },
  om: { chats: 'Haasaa', status: 'Haala', calls: 'Waamicha', contacts: 'Qunnamtii', communities: 'Hawaasa', settings: 'Qindaa\'ina', typeMessage: 'Ergaa barreessi...', online: 'Toora irra jira', offline: 'Toora irraa ala', voiceCall: 'Waamicha sagalee', videoCall: 'Waamicha viidiyoo', endCall: 'Waamicha xumuri', answerCall: 'Deebisi', declineCall: 'Didi', search: 'Barbaadi...' },
  ps: { chats: 'خبرې اترې', status: 'حالت', calls: 'زنګونه', contacts: 'اړیکې', communities: 'ټولنې', settings: 'ترتیبات', typeMessage: 'یو پیغام ولیکئ...', online: 'آنلاین', offline: 'آفلاین', voiceCall: 'غږیز زنګ', videoCall: 'ویډیویي زنګ', endCall: 'زنګ پای ته رسول', answerCall: 'ځواب ورکول', declineCall: 'رد کول', search: 'لټون...' },
  qu: { chats: 'Rimanakuykuna', status: 'Kaynin', calls: 'Waqyaykuna', contacts: 'Tupanapaq', communities: 'Ayllukuna', settings: 'Allichanakuna', typeMessage: 'Qillqay willakuyta...', online: 'Llikapi', offline: 'Manam llikapichu', voiceCall: 'Kunkawan waqyay', videoCall: 'Rikunakuy waqyay', endCall: 'Tukuchiy waqyayta', answerCall: 'Kutichiy', declineCall: 'Mananchay', search: 'Maskay...' },
  sm: { chats: 'Talanoaga', status: 'Tulaga', calls: 'Valaau', contacts: 'Fesootaiga', communities: 'Nuu', settings: 'Faatulagaga', typeMessage: 'Tusi se feau...', online: 'I luga o le laina', offline: 'E le o luga o le laina', voiceCall: 'Valaau leo', videoCall: 'Valaau vitiō', endCall: 'Faamuta le valaau', answerCall: 'Tali', declineCall: 'Teena', search: 'Su\'e...' },
  sr: { chats: 'Разговори', status: 'Статус', calls: 'Позиви', contacts: 'Контакти', communities: 'Заједнице', settings: 'Подешавања', typeMessage: 'Унесите поруку...', online: 'На мрежи', offline: 'Ван мреже', voiceCall: 'Гласовни позив', videoCall: 'Видео позив', endCall: 'Заврши позив', answerCall: 'Јави се', declineCall: 'Одбиј', search: 'Претражи...' },
  st: { chats: 'Puisano', status: 'Boemo', calls: 'Mehala', contacts: 'Mabitso', communities: 'Sechaba', settings: 'Litlhophiso', typeMessage: 'Ngola molaetsa...', online: 'Inthaneteng', offline: 'Eseng inthaneteng', voiceCall: 'Mohala oa lentsoe', videoCall: 'Mohala oa video', endCall: 'Qeta mohala', answerCall: 'Araba', declineCall: 'Hana', search: 'Batla...' },
  sn: { chats: 'Hurukuro', status: 'Mamiriro', calls: 'Kufona', contacts: 'Vanhu', communities: 'Nharaunda', settings: 'Zvirongwa', typeMessage: 'Nyora meseji...', online: 'Paurandandanda', offline: 'Kwete paurandandanda', voiceCall: 'Kufona nenzwi', videoCall: 'Kufona nevhidhiyo', endCall: 'Pedza kufona', answerCall: 'Pindura', declineCall: 'Ramba', search: 'Tsvaga...' },
  si: { chats: 'කතාබස්', status: 'තත්ත්වය', calls: 'ඇමතුම්', contacts: 'සබඳතා', communities: 'ප්‍රජාවන්', settings: 'සැකසීම්', typeMessage: 'පණිවිඩයක් ලියන්න...', online: 'සබැඳිව', offline: 'නොබැඳිව', voiceCall: 'හඬ ඇමතුම', videoCall: 'වීඩියෝ ඇමතුම', endCall: 'ඇමතුම අවසන් කරන්න', answerCall: 'පිළිතුරු දෙන්න', declineCall: 'ප්‍රතික්ෂේප කරන්න', search: 'සොයන්න...' },
  sl: { chats: 'Klepeti', status: 'Stanje', calls: 'Klici', contacts: 'Stiki', communities: 'Skupnosti', settings: 'Nastavitve', typeMessage: 'Napišite sporočilo...', online: 'V omrežju', offline: 'Brez povezave', voiceCall: 'Glasovni klic', videoCall: 'Videoklic', endCall: 'Končaj klic', answerCall: 'Sprejmi', declineCall: 'Zavrni', search: 'Išči klepete...' },
  so: { chats: 'Sheekooyinka', status: 'Xaaladda', calls: 'Wicitaanada', contacts: 'Xiriirada', communities: 'Bulshooyinka', settings: 'Dejinta', typeMessage: 'Qor fariin...', online: 'Khadka ku jira', offline: 'Khadka ka maqan', voiceCall: 'Wicitaan cod ah', videoCall: 'Wicitaan muuqaal ah', endCall: 'Dami wicitaanka', answerCall: 'Ka jawaab', declineCall: 'Diid', search: 'Raadi...' },
  su: { chats: 'Obrolan', status: 'Kaanan', calls: 'Telepon', contacts: 'Kontak', communities: 'Komunitas', settings: 'Setélan', typeMessage: 'Tulis pesen...', online: 'Online', offline: 'Offline', voiceCall: 'Telepon Sora', videoCall: 'Telepon Video', endCall: 'Pungkas Telepon', answerCall: 'Walon', declineCall: 'Tolak', search: 'Pilari...' },
  tg: { chats: 'Гуфтугӯҳо', status: 'Ҳолат', calls: 'Зангҳо', contacts: 'Тамосҳо', communities: 'Ҷомеаҳо', settings: 'Танзимот', typeMessage: 'Паём нависед...', online: 'Дар шабака', offline: 'Ғайрифаъол', voiceCall: 'Занги овозӣ', videoCall: 'Занги видеоӣ', endCall: 'Анҷоми занг', answerCall: 'Ҷавоб додан', declineCall: 'Рад кардан', search: 'Ҷустуҷӯ...' },
  bo: { chats: 'སྐད་ཆ།', status: 'གནས་སྟངས།', calls: 'ཁ་པར།', contacts: 'འབྲེལ་གཏུགས།', communities: 'སྤྱི་ཚོགས།', settings: 'སྒྲིག་འགོད།', typeMessage: 'འཕྲིན་ཡིག་འབྲི་བ།...', online: 'དྲ་ཐོག', offline: 'དྲ་ཕྱི།', voiceCall: 'སྐད་སྒྲའི་ཁ་པར།', videoCall: 'བརྙན་རིས་ཁ་པར།', endCall: 'ཁ་པར་མཇུག་སྒྲིལ།', answerCall: 'ལན་འདེབས།', declineCall: 'ငြင်းပယ်བ།', search: 'འཚོལ་བ།...' },
  ti: { chats: 'ዕላላት', status: 'ኩነታት', calls: 'ድውላት', contacts: 'ዝምድናታት', communities: 'ማሕበረሰባት', settings: 'ቅጥዕታት', typeMessage: 'መልእኽቲ ጸሓፍ...', online: 'ኣብ መስመር', offline: 'ካብ መስመር ወጻኢ', voiceCall: 'ናይ ድምጺ ድውል', videoCall: 'ናይ ቪድዮ ድውል', endCall: 'ድውል ዓጹ', answerCall: 'መልስ', declineCall: 'ኣይትቀበል', search: 'ድለ...' },
  to: { chats: 'Ngaahi Poletu\'a', status: 'Tu\'unga', calls: 'Ngaahi Telefoni', contacts: 'Ngaahi Fetu\'utaki', communities: 'Kāinga', settings: 'Ngaahi Fokotu\'utu\'u', typeMessage: 'Tohi ha pōpoaki...', online: 'Fetu\'utaki he uaea', offline: 'Puna mei he uaea', voiceCall: 'Telefoni le\'o', videoCall: 'Telefoni vitiō', endCall: 'Tuku e telefoni', answerCall: 'Tali', declineCall: 'Fakafisinga\'i', search: 'Kumi...' },
  tn: { chats: 'Dipuisano', status: 'Boemo', calls: 'Megala', contacts: 'Makwalo a kgolagano', communities: 'Setšhaba', settings: 'Dithulaganyo', typeMessage: 'Kwala molaetsa...', online: 'Mo maranyaneng', offline: 'O tswile mo maranyaneng', voiceCall: 'Mogala wa lentswe', videoCall: 'Mogala wa bidio', endCall: 'Fetsa mogala', answerCall: 'Araba', declineCall: 'Gana', search: 'Batla...' },
  tk: { chats: 'Söhbetdeşlikler', status: 'Ýagdaý', calls: 'Jaňlar', contacts: 'Aragatnaşyklar', communities: 'Jemgyýetler', settings: 'Sazlamalar', typeMessage: 'Haty ýazyň...', online: 'Onlaýn', offline: 'Oflaýn', voiceCall: 'Sesli jaň', videoCall: 'Wideo jaň', endCall: 'Jaňy tamamla', answerCall: 'Jogap ber', declineCall: 'Ret et', search: 'Gözle...' },
  uz: { chats: 'Suhbatlar', status: 'Holat', calls: 'Qo\'ng\'iroqlar', contacts: 'Kontaktlar', communities: 'Hamjamiyatlar', settings: 'Sozlamalar', typeMessage: 'Xabar yozing...', online: 'Tarmoqda', offline: 'Tarmoqdan tashqarida', voiceCall: 'Ovozli qo\'ng\'iroq', videoCall: 'Video qo\'ng\'iroq', endCall: 'Qo\'ng\'iroqni tugatish', answerCall: 'Javob berish', declineCall: 'Rad etish', search: 'Qidirish...' },
  cy: { chats: 'Sgyrsiau', status: 'Statws', calls: 'Galwadau', contacts: 'Cysylltiadau', communities: 'Cymunedau', settings: 'Gosodiadau', typeMessage: 'Ysgrifennwch neges...', online: 'Ar-lein', offline: 'All-lein', voiceCall: 'Galwad llais', videoCall: 'Galwad fideo', endCall: 'Gorffen galwad', answerCall: 'Ateb', declineCall: 'Gwrthod', search: 'Chwilio sgyrsiau...' },
  wo: { chats: 'Waxtaan yi', status: 'Melokaan', calls: 'Wooté yi', contacts: 'Nite yi', communities: 'Mbooloo yi', settings: 'Kompalaas bi', typeMessage: 'Bindal bataaxal...', online: 'Mu ngi ci xët wi', offline: 'Nekkul ci xët wi', voiceCall: 'Wooté baat', videoCall: 'Wooté nataal', endCall: 'Tëj wooté bi', answerCall: 'Tontu', declineCall: 'Bañ', search: 'Seet...' },
  xh: { chats: 'Iincoko', status: 'Imeko', calls: 'Iminxeba', contacts: 'Abaqhagamshelwano', communities: 'Uluntu', settings: 'Iisetingi', typeMessage: 'Bhala umyalezo...', online: 'Ukwi-intanethi', offline: 'Awekho kwi-intanethi', voiceCall: 'Umnxeba welizwi', videoCall: 'Umnxeba wevidiyo', endCall: 'Phelisa umnxeba', answerCall: 'Phendula', declineCall: 'Khabha', search: 'Khangela...' }
};

// 1. Extract existing SUPPORTED_LANGUAGES and append new ones
const langArrayMatch = content.match(/export const SUPPORTED_LANGUAGES: LanguageOption\[\] = (\[[\s\S]*?\]);/);
if (!langArrayMatch) {
  console.error('Could not find SUPPORTED_LANGUAGES array');
  process.exit(1);
}

const existingLangs = eval(langArrayMatch[1]);
const existingCodes = new Set(existingLangs.map(l => l.code));

const combinedLangs = [...existingLangs];
for (const nl of NEW_LANGUAGES) {
  if (!existingCodes.has(nl.code)) {
    combinedLangs.push(nl);
  }
}

combinedLangs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

// 2. Extract existing TRANSLATIONS and merge additional dictionaries
const transStartStr = 'export const TRANSLATIONS: Record<string, Record<string, string>> = ';
const transStartIndex = content.indexOf(transStartStr);
const transEndStr = 'export const CORE_ENGLISH_KEYS';
const transEndIndex = content.indexOf(transEndStr);

if (transStartIndex === -1 || transEndIndex === -1) {
  console.error('Could not find TRANSLATIONS bounds');
  process.exit(1);
}

let existingTransCode = content.substring(transStartIndex + transStartStr.length, transEndIndex).trim();
if (existingTransCode.endsWith(';')) existingTransCode = existingTransCode.slice(0, -1);

let existingDicts = {};
try {
  existingDicts = eval('(' + existingTransCode + ')');
} catch (e) {
  console.error('Error evaluating TRANSLATIONS', e);
  process.exit(1);
}

// Ensure each new language has its dictionary based on template + English fallback
const enDict = existingDicts['en'] || {};
for (const nl of NEW_LANGUAGES) {
  const code = nl.code;
  const tpl = TEMPLATES[code] || {};
  const merged = {
    ...enDict,
    ...tpl,
    language: nl.nativeName,
    selectLanguage: nl.name,
  };
  existingDicts[code] = merged;
}

// Also ensure base translations for common keys exist in all languages
const newLanguagesJson = JSON.stringify(combinedLangs, null, 2);
const newTranslationsJson = JSON.stringify(existingDicts, null, 2);

const beforeLanguages = content.substring(0, content.indexOf('export const SUPPORTED_LANGUAGES: LanguageOption[] = '));
const afterTranslations = content.substring(transEndIndex);

const newContent = `${beforeLanguages}export const SUPPORTED_LANGUAGES: LanguageOption[] = ${newLanguagesJson};\n\nexport const TRANSLATIONS: Record<string, Record<string, string>> = ${newTranslationsJson};\n\n${afterTranslations}`;

fs.writeFileSync(targetPath, newContent, 'utf8');
console.log(`Successfully updated languages.ts with ${combinedLangs.length} languages!`);
