// Geographic Data and Presets for Purchase Sources and Storage Locations

export interface DivisionWithDistricts {
  name: string;
  districts: {
    name: string;
    upazilas?: string[];
  }[];
}

export const BANGLADESH_DIVISIONS: DivisionWithDistricts[] = [
  {
    name: "Dhaka",
    districts: [
      {
        name: "Dhaka",
        upazilas: [
          "Gulshan",
          "Banani",
          "Dhanmondi",
          "Mirpur",
          "Uttara",
          "Kotwali",
          "Motijheel",
          "Mohammadpur",
          "Tejgaon",
          "Badda",
          "Lalbagh",
          "Ramna",
          "Demra",
          "Keraniganj",
          "Savar",
          "Dhamrai",
        ],
      },
      {
        name: "Narayanganj",
        upazilas: ["Narayanganj Sadar", "Bandar", "Fatullah", "Rupganj", "Sonargaon", "Araihazar"],
      },
      {
        name: "Gazipur",
        upazilas: ["Gazipur Sadar", "Tongi", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"],
      },
      {
        name: "Munshiganj",
        upazilas: ["Munshiganj Sadar", "Tongibari", "Sirajdikhan", "Lohajang", "Sreenagar", "Gazaria"],
      },
      {
        name: "Manikganj",
        upazilas: ["Manikganj Sadar", "Singair", "Saturia", "Shibalaya", "Harirampur", "Ghior", "Daulatpur"],
      },
      {
        name: "Narsingdi",
        upazilas: ["Narsingdi Sadar", "Palash", "Madhabdi", "Shibpur", "Raipura", "Belabo", "Monohardi"],
      },
      {
        name: "Tangail",
        upazilas: ["Tangail Sadar", "Mirzapur", "Delduar", "Nagarpur", "Sakhipur", "Basail", "Kalihati", "Ghatail"],
      },
      { name: "Faridpur", upazilas: ["Faridpur Sadar", "Boalmari", "Bhanga", "Nagarkanda", "Madhukhali"] },
      { name: "Gopalganj", upazilas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"] },
      { name: "Kishoreganj", upazilas: ["Kishoreganj Sadar", "Bhairab", "Bajitpur", "Kuliarchar", "Pakundia"] },
      { name: "Madaripur", upazilas: ["Madaripur Sadar", "Shibchar", "Kalkini", "Rajoir"] },
      { name: "Rajbari", upazilas: ["Rajbari Sadar", "Goalanda", "Pangsha", "Baliakandi", "Kalukhali"] },
      { name: "Shariatpur", upazilas: ["Shariatpur Sadar", "Naria", "Zajira", "Damudya", "Bhedarganj", "Gosairhat"] },
    ],
  },
  {
    name: "Chittagong",
    districts: [
      {
        name: "Chittagong",
        upazilas: [
          "Double Mooring",
          "Kotwali",
          "Agrabad C/A",
          "Pahartali",
          "Panchlaish",
          "Chandgaon",
          "Halishahar",
          "Patenga",
          "Sitakunda",
          "Mirsharai",
          "Hathazari",
          "Patiya",
          "Boalkhali",
          "Anwara",
        ],
      },
      {
        name: "Cox's Bazar",
        upazilas: ["Cox's Bazar Sadar", "Chakaria", "Teknaf", "Ukhia", "Ramu", "Maheshkhali", "Pekua", "Kutubdia"],
      },
      {
        name: "Comilla",
        upazilas: ["Comilla Adarsha Sadar", "Comilla Sadar Dakshin", "Chandina", "Daudkandi", "Debidwar", "Burichang", "Laksam"],
      },
      { name: "Feni", upazilas: ["Feni Sadar", "Daganbhuiyan", "Chhagalnaiya", "Sonagazi", "Parshuram", "Fulgazi"] },
      { name: "Brahmanbaria", upazilas: ["Brahmanbaria Sadar", "Ashuganj", "Sarail", "Kasba", "Nabinagar", "Akhaura"] },
      { name: "Noakhali", upazilas: ["Noakhali Sadar", "Begumganj", "Senbagh", "Chatkhil", "Companyganj", "Hatiya"] },
      { name: "Chandpur", upazilas: ["Chandpur Sadar", "Faridganj", "Hajiganj", "Shahrasti", "Matlab Uttar", "Matlab Dakshin"] },
      { name: "Lakshmipur", upazilas: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"] },
      { name: "Rangamati", upazilas: ["Rangamati Sadar", "Kaptai", "Baghaichhari", "Barkal", "Langadu"] },
      { name: "Khagrachhari", upazilas: ["Khagrachhari Sadar", "Dighinala", "Panchhari", "Mahalchhari", "Ramgarh"] },
      { name: "Bandarban", upazilas: ["Bandarban Sadar", "Ruma", "Thanchi", "Lama", "Alikadam", "Naikhongchhari"] },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      { name: "Rajshahi", upazilas: ["Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Paba", "Godagari", "Tanore", "Bagmara", "Durgapur", "Charghat", "Puthia", "Bagha"] },
      { name: "Bogra", upazilas: ["Bogra Sadar", "Shajahanpur", "Sherpur", "Shibganj", "Gabtali", "Kahaloo", "Dhunat", "Sariakandi", "Sonatala", "Nandigram", "Adamdighi", "Dupchanchia"] },
      { name: "Pabna", upazilas: ["Pabna Sadar", "Ishwardi", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Santhia", "Sujanagar"] },
      { name: "Sirajganj", upazilas: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Rayganj", "Shahjadpur", "Tarash", "Ullapara"] },
      { name: "Naogaon", upazilas: ["Naogaon Sadar", "Mohadevpur", "Manda", "Patnitala", "Dhamoirhat", "Badalgachhi", "Niamatpur", "Sapahar", "Porsha", "Raninagar", "Atrai"] },
      { name: "Natore", upazilas: ["Natore Sadar", "Baraigram", "Bagatipara", "Gurudaspur", "Lalpur", "Singra", "Naldanga"] },
      { name: "Chapainawabganj", upazilas: ["Chapainawabganj Sadar", "Shibganj", "Gomastapur", "Nachole", "Bholahat"] },
      { name: "Joypurhat", upazilas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"] },
    ],
  },
  {
    name: "Khulna",
    districts: [
      { name: "Khulna", upazilas: ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur", "Khan Jahan Ali", "Dighalia", "Rupsha", "Terokhada", "Dumuria", "Batiaghata", "Dacope", "Paikgachha", "Koyra", "Phultala"] },
      { name: "Jessore", upazilas: ["Jessore Sadar", "Jhikargachha", "Sharsha", "Manirampur", "Abhaynagar", "Bagherpara", "Chaugachha", "Keshabpur"] },
      { name: "Kushtia", upazilas: ["Kushtia Sadar", "Kumarkhali", "Khoksa", "Mirpur", "Bheramara", "Daulatpur"] },
      { name: "Satkhira", upazilas: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"] },
      { name: "Bagerhat", upazilas: ["Bagerhat Sadar", "Mongla", "Morrelganj", "Fakirhat", "Rampal", "Kachua", "Mollahat", "Chitalmari", "Sarankhola"] },
      { name: "Jhenaidah", upazilas: ["Jhenaidah Sadar", "Harinakundu", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"] },
      { name: "Chuadanga", upazilas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"] },
      { name: "Magura", upazilas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"] },
      { name: "Narail", upazilas: ["Narail Sadar", "Kalia", "Lohagara"] },
      { name: "Meherpur", upazilas: ["Meherpur Sadar", "Gangni", "Mujibnagar"] },
    ],
  },
  {
    name: "Barisal",
    districts: [
      { name: "Barisal", upazilas: ["Barisal Sadar", "Babuganj", "Bakerganj", "Banaripara", "Gournadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur", "Agailjhara"] },
      { name: "Patuakhali", upazilas: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Dumki", "Rangabali"] },
      { name: "Bhola", upazilas: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"] },
      { name: "Pirojpur", upazilas: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad (Swarupkati)", "Indurkani"] },
      { name: "Jhalokati", upazilas: ["Jhalokati Sadar", "Kathalia", "Nalchhiti", "Rajapur"] },
      { name: "Barguna", upazilas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"] },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      { name: "Sylhet", upazilas: ["Sylhet Sadar", "Beanibazar", "Bishwanath", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Companiganj", "Zakiganj", "Osmani Nagar"] },
      { name: "Moulvibazar", upazilas: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"] },
      { name: "Habiganj", upazilas: ["Habiganj Sadar", "Bahubal", "Baniachang", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Ajmiriganj", "Shayestaganj"] },
      { name: "Sunamganj", upazilas: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shantiganj", "Shalla", "Tahirpur"] },
    ],
  },
  {
    name: "Rangpur",
    districts: [
      { name: "Rangpur", upazilas: ["Rangpur Sadar", "Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"] },
      { name: "Dinajpur", upazilas: ["Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"] },
      { name: "Gaibandha", upazilas: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"] },
      { name: "Kurigram", upazilas: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur"] },
      { name: "Nilphamari", upazilas: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"] },
      { name: "Thakurgaon", upazilas: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"] },
      { name: "Lalmonirhat", upazilas: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"] },
      { name: "Panchagarh", upazilas: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"] },
    ],
  },
  {
    name: "Mymensingh",
    districts: [
      { name: "Mymensingh", upazilas: ["Mymensingh Sadar", "Muktagachha", "Fulbaria", "Trishal", "Bhaluka", "Gafargaon", "Haluaghat", "Dhobaura", "Phulpur", "Tara Khanda", "Gouripur", "Ishwarganj", "Nandail"] },
      { name: "Jamalpur", upazilas: ["Jamalpur Sadar", "Baksiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"] },
      { name: "Netrokona", upazilas: ["Netrokona Sadar", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala", "Atpara"] },
      { name: "Sherpur", upazilas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"] },
    ],
  },
];

export const COMMON_COUNTRIES = [
  "Bangladesh",
  "China",
  "India",
  "Vietnam",
  "Pakistan",
  "Turkey",
  "Thailand",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Germany",
  "Italy",
  "Japan",
  "South Korea",
  "Indonesia",
  "Malaysia",
  "Sri Lanka",
  "Other",
];

export const SOURCE_TYPES = [
  "Manufacturer / Factory",
  "Wholesale Shop",
  "Wholesale Market Stall",
  "Distributor",
  "Importer",
  "Local Supplier",
  "Retail Shop",
  "Online Supplier",
  "Other",
];

export const STORAGE_TYPES = [
  "Main Warehouse",
  "Branch Warehouse",
  "Showroom",
  "Retail Shop",
  "Factory",
  "Small Storage Room",
  "Temporary Storage",
  "Distribution Center",
  "Other",
];

export const CAPACITY_UNITS = [
  "Pieces",
  "Boxes",
  "Cartons",
  "KG",
  "Rolls",
  "Meters",
  "Yards",
  "Bales",
  "Liters",
  "Bundles",
];

export const CURRENCIES = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka (BDT)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan (CNY)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham (AED)" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen (JPY)" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira (TRY)" },
];

