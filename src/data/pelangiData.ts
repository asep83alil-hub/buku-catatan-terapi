import { Student, TherapySession } from '../types';
import { parseTimestampOrDate, parseStudentName } from '../utils/excelParser';
import { generateSessionHash } from '../utils/storage';

export const RAW_PELANGI_CSV = `Timestamp,NAMA SISWA,NAMA TERAPIS,JENIS TERAPI,Lembar Progres Sesi,Program Intervensi,Respon Ananda Terhadap Intervensi
9/16/2026 9:39:18,Adnan Lutfan Malik (Adnan),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Adnan mampu beraktifitas dengan baik dan cukup responsif, dalam menamai 1 kata dan frase cukup baik dengan bantuan koreksi artikulasi , membuat kalimat SPO masih dibantu di bagian predikat yaitu di kata kerja. Dalam bernyanyi masih terus ditingkatkan kemampuannya dan produksi artikulasi nya.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Cukup kooperatif 
9/16/2026 9:41:38,Ahmad Putra Raffasya Wiratama (Ahmad),"Eva Dwi Gusfianti, A.Md.TW",Terapi Wicara,"Hari ini Ahmad cukup kooperatif dalam mengikuti aktivitas terapi wicara. Kegiatan diawali dengan oral motor exercise untuk membantu meningkatkan kesiapan dan kemampuan gerak organ bicara. Selanjutnya dilakukan latihan vokalisasi /a, i, u, e, o/ dengan mengikuti arahan terapis.
Ahmad juga melakukan latihan penguatan otot rahang untuk membantu meningkatkan kekuatan dan koordinasi gerakan rahang. Pada aktivitas V.M.C (Visual Motor Coordination), Ahmad berlatih meronce dan cukup mampu mengikuti kegiatan dengan arahan terapis.
Selanjutnya dilakukan latihan ekspresif dan reseptif tingkat kata, khususnya mengenal, memahami, dan menyebutkan nama-nama buah. Secara keseluruhan, Ahmad cukup kooperatif selama sesi terapi dan mampu mengikuti berbagai aktivitas yang diberikan dengan arahan terapis.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",cukup koperatif 
9/16/2026 9:47:39,Raditya Arsya Ramadian (Radit),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Raditya belajar dengan kooperatif selama sesi berlangsung, Ananda di minta untuk membaca buku cerita dan diminta untuk menceritakannya kembali, responnya masih dibantu, Ananda juga di minta untuk menceritakan kegiatan yang dilakukan sebelum datang ke Pelangi, responnya cukup baik dan masih dibantu untuk menyusun kalimat dan cerita nya. ","Berdoa, Bahasa Reseptif, Bahasa Ekspresif",Kooperatif 
9/16/2026 9:51:54,Aryanti Wandayu Nugroho (Wanda),"Eva Dwi Gusfianti, A.Md.TW",Terapi Wicara,"Hari ini Wandayu terlihat kurang kooperatif dalam mengikuti aktivitas terapi wicara. Atensi dan konsentrasinya masih mudah teralih sehingga beberapa kegiatan membutuhkan arahan dan pengulangan dari terapis.
Aktivitas yang dilakukan meliputi V.M.C (Visual Motor Coordination) melalui permainan puzzle huruf. Selanjutnya dilakukan latihan ekspresif dan reseptif tingkat kata benda. Pada latihan ini, Wandayu lebih banyak diam dibandingkan menirukan kata yang diberikan oleh terapis. Wandayu juga mengikuti aktivitas bernyanyi untuk menstimulasi kemampuan vokalisasi dan imitasi.
Latihan komunikasi dua arah dilakukan melalui interaksi dan tanya jawab sederhana. Wandayu masih membutuhkan arahan serta stimulasi dari terapis agar dapat mengikuti alur komunikasi dengan lebih baik. Secara keseluruhan, Wandayu masih memerlukan pendampingan dan stimulasi secara konsisten untuk meningkatkan atensi, konsentrasi, kemampuan meniru kata, serta komunikasi dua arah.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, v.m.c ",kurang koperatif 
9/16/2026 10:03:17,Abdul Karim Sumitro (Aka),Dara Kinanti,Okupasi Terapi /SI,"Hari ini sesi terapi di awali dengan Aka diinstruksikan untuk Exercise mengelilingi Ruang SI sebanyak 3x Repetisi. Kemudian Aka diberikan aktivitas bersama teman yaitu:
1. Membawa Bola dengan menggunakan Tongkat 
2. Bermain Congklak

Aktivitas ini bertujuan untuk meningkatkan Koordinasi Bilateral, Fine motor, Eye hand-coordination, motor planning, pemahaman aturan bermain.

Aka cukup kooperatif selama sesi terapi berlangsung, namun masih banyak meracau.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup Kooperatif
9/16/2026 10:12:50,Hadil Samer Abdelkareem (Dudu),Dara Kinanti,Okupasi Terapi /SI,"Sesi terapi hari ini diawali dengan Dudu diajak untuk melakukan aktivitas Yoga selama 10 menit untuk meningkatkan fleksibilitas dan kemampuan imitasi gerak Dudu.

Kemudian dilanjutkan dengan intervensi berupa 
1. memasang hula hoop, 
2. membawa bola menggunakan stick lalu memasukkannya ke dalam ember,
3. bermain congklak 

Aktivitas tersebut bertujuan untuk melatih motorik kasar, koordinasi mata-tangan, perencanaan gerak (motor planning), motorik halus, serta mengasah fungsi kognitif dan fokus melalui pemahaman aturan permainan.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif dengan arahan
9/16/2026 10:48:47,Shadiq Alfarezi (Shadiq),Inggreat Rahmawanty,Okupasi Terapi /SI,Hari ini Syadiq cukup kooperatif dan bersemangat selama sesi terapi. ,"Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Syadiq mampu menyelesaikan tugasnya dengan bantuan dan arahan terapis. Sesekali terapis mengurangi bantuan agar Syadiq mampu kinsisten dalam menyelesaikan tugas yang diberikan. Untuk aktifitas dengan gymball syadiq masih terlihat cemas dan kurang nyaman. 
9/16/2026 10:50:52,Nizam Hafidzan Prawiji (Nizam),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Nizam dalam beraktivitas cukup baik responnya walaupun sedang kurang fit, hari ini duduk di matras dan tidak banyak bergerak,, sikat oral mau dilakukan,, meniup masih banyak distimulus, menamai 1 kata masih belum konsisten, merangkai 3 kata jadi 1 kata kalimat SPO mau di tirukan hari ini namun masih belum konsisten.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Cukup kooperatif 
9/16/2026 11:48:56,Fachri Akbar Bachtiar (Fachri),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Fachri beraktivitas dengan baik , mau mengikuti instruksi yang diberikan oleh terapis, menamai gambar 3 kata , berdoa, bernyanyi dan menirukan gerakan motorik oral lidah, bibir dan gigi. Ananda diminta untuk melakukan aktivitas bergerak seperti melompat, berjalan maju mundur agar tidak ngantuk dan mencuci mukanya di toilet. Suara yang diproduksi hari ini cukup baik.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Cukup kooperatif 
9/16/2026 13:27:53,Azizio Rasyid Wisnantama (Zio),Rodiah Arjuwani,Okupasi Terapi /SI,"Pada sesi terapi hari ini, Zio kooperatif mau diarahkan untuk menyelesaikan aktivitas hingga akhir. Diawal Zio bermain Tetris untuk melatih visual persepsi dan koordinasi mata tangan, Zio dibantu untuk menyelesaikan aktivitas. Kemudian Zio menyelesaikan aktivitas mengambil bola sesuai instruksi warna sebanyak 4 warna untuk melatih short term memory dan visual persepsi, Zio mampu mengikuti. Lalu Zio diminta mengambil bola sesuai urutan warna, Zio masih dengan arahan. Selanjutnya Zio latihan menulis angka 1-10 dan imitasi garis dan bentuk sederhana, Zio masih dengan bantuan ketika membuat angka 8 dan bentuk belah ketupat, selebihnya mampu mengikuti sesuai contoh.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif 
9/16/2026 13:37:13,Rasya Zafran Aqila (Rasya),Rodiah Arjuwani,Okupasi Terapi /SI,"Pada sesi terapi hari ini zhafran kooperatif dan mau mengikuti aktivitas. Pertama zhafran exercise sebanyak 3x pengulangan, zhafran mampu mengikuti secara mandiri. Kedua zhafran bermain bersama teman memindahkan bola kecil dengan mengangkat kedua tongkat bersama teman untuk melatih kerjasama dan inisiasi saat aktivitas berkelompok, zhafran mampu mengikuti arahan meskipun inisiasi untuk bicara ke teman dalam kerjasama masih dengan arahan. Kemudian zhafran bermain congklak bersama teman, zhafran disarankan ketika menyelesaikan.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif 
9/16/2026 13:47:28,Haza Arsyada Dien (Haza),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Haza mampu kooperatif dalam sesi terapi, membaca buku cerita dan menceritakan kembali masih dengan bantuan, mendeskripsikan sebuah objek dari kategori hewan dan buah masih dengan bantuan, bercerita masih kadang keluar dari tema atau topik.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Kooperatif 
9/16/2026 13:59:47,Rayhan Ashami Eishennoiraz (Rayhan),"Eka Talia Kameswari, A.Md. OT",Okupasi Terapi /SI,"Sesi hari ini dimulai dengan olahraga mengelilingi ruangan sebanyak 10x. Setelah itu, Tr Eka meminta Rayhan untuk berbaring untuk sesi relaksasi. Saat sesi tersebut, Rayhan masih belum bisa tenang (banyak bergerak). Sehingga saat sesi tersebut selesai, Tr Eka memberikan konsekuensi kepada Rayhan untuk tidak boleh ikut bermain bersama teman (jadi hanya melihat saja). Tr Eka melakukan negosiasi, jika Rayhan ingin ikut main bersama teman, Rayhan harus berhitung terlebih dahulu 1 - 50. Setelah itu baru Rayhan boleh bermain bersama teman. 

Aktivitas yang dilakukan : 
Duduk melingkar, bermain “Simon Says”, lalu siapa yang paling cepat mengambil objek. ","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup kooperatif dengan arahan
9/16/2026 14:02:39,Akasa Biru Mardani (Akasa),Rodiah Arjuwani,Okupasi Terapi /SI,"Pada sesi terapi hari ini Akasa kooperatif, Akasa hari ini telat 3 menit. Kepatuhan dengan arahan. Penyelesaian aktivitas baik. Kebutuhan gerak masih tinggi terlihat ketika aktivitas duduk, Akasa perlu arahan untuk duduk tenang. Akasa bermain bersama teman menjawab pertanyaan sesuai instruksi yang diberikan, Akasa mampu mengikuti instruksi dan masih dengan arahan ketika mempertahankan fokus. Kemudian Akasa bermain uno stacko dengan teman dengan cara menyusun balok secara bergantian dan mengambil balok lau disusun diatas balok secara bergantian, Akasa dengan arahan ketika duduk tenang dan menunggu giliran.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif 
9/16/2026 14:42:31,Rayhan Ashami Eishennoiraz (Rayhan),Ruri Santi Hapsari,Terapi Wicara,"Ananda Rayhan hari ini beraktivitas dengan baik dan cukup kooperatif, menyebutkan 10 macam kategorisasi dalam bahasa Indonesia dari konsep warna ,buah, hewan, alat transportasi dan makanan, kejelasan bicara dan artikulasi masih banyak di koreksi dan di arahkan cara produksi nya, suara juga masih diingatkan untuk lebih keras agar jelas produksi nya. Menjawab pertanyaan sederhana rumah masih dijawab jauh, ","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Cukup kooperatif 
9/16/2026 14:48:48,Arka Narendra Sukandar (Arka N),"Eka Talia Kameswari, A.Md. OT",Okupasi Terapi /SI,"Hari ini Arka good, bisa mengikuti intruksi dengan baik. Fokus dan atensi masih perlu dioptimalkan dan diingatkan. 
Aktivitas hari ini : 
1. Olahraga berkeliling ruangan sebanyak 10x
2. Relaksasi (posisi tiduran) 
3. Giring bola menggunakan hoop besar
4. Bawa hoop besar di perut bersama teman sambil bawa bola basket menggunakan tangan. 

Respon : 
Arka masih sering terburu-buru saat mengerjakan aktivitas, sehingga perlu terus diingatkan. ","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif dengan arahan 
9/16/2026 15:17:41,Danesh Abrar Hastomo (Danesh),Dara Kinanti,Okupasi Terapi /SI,"Hari ini sesi terapi Danesh diawali dengan latihan keliling ruang SI sebanyak 10 kali putaran untuk membantu regulasi diri, megarahkan fokus, serta menyiapkan fisik sebelum masuk ke aktivitas utama. Selanjutnya, Danesh mengikuti aktivitas kelompok:
1 Estafet Ring Bergandengan Tangan: Melatih kesadaran tubuh (body awareness), perencanaan gerak (praxis), fleksibilitas motorik kasar, serta kemampuan bekerja sama dan berinteraksi dalam kelompok.
2 Permainan Simon Says: Melatih pemrosesan pendengaran (auditory processing), pemahaman instruksi, kontrol impuls/fokus, serta koordinasi mata-tangan saat mengidentifikasi dan mengambil benda sesuai petunjuk.

Secara keseluruhan, Danesh cukup kooperatif selama sesi terapi berlangsung. Namun masih muncul perilaku usil dan kurang fokus sehingga membutuhkan arahan untuk kembali fokus.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi, Group Therapy",Cukup Kooperatif
9/16/2026 15:24:32,Giriandra Aryasena (Sena),Dara Kinanti,Okupasi Terapi /SI,"Sesi terapi Sena hari ini diawali dengan aktivitas memindahkan bola sambil berlari serta naik-turun tangga untuk stimulasi regulasi diri, meningkatkan stamina, dan pemanasan motorik kasar. Kemudian, Sena diberikan beberapa aktivitas:
1 Gym Activities: Sena masih berada dalam tahap penyesuaian dan menunjukkan rasa kurang nyaman, sehingga stimulasi diberikan secara perlahan dan bertahap sesuai toleransinya.
2 Obstacle Melompat Ring & Balance Board (Pasang Puzzle): Melatih perencanaan gerak (praxis), keseimbangan, serta integrasi persepsi visual-motorik saat menyusun puzzle.
3 Melepas Jepit di Atas Balance Board: Melatih kontrol keseimbangan statis, kekuatan otot inti (core stability), serta integrasi koordinasi motorik halus (kekuatan jari-jemari).

Pada aktivitas melompat dan melewati balance board, Sena menunjukkan usaha yang cukup baik dan saat ini masih memerlukan bantuan minimal berupa pegangan tangan dari terapis untuk menjaga keseimbangan serta membangun rasa percaya dirinya.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup Kooperatif
9/16/2026 16:04:39,Raditya Askara Daya (Raditya A),"Eva Dwi Gusfianti, A.Md.TW",Terapi Wicara,"Hari ini Radit cukup kooperatif dalam mengikuti aktivitas terapi wicara. Radit bersedia mengikuti beberapa aktivitas yang diberikan, meskipun masih perlu diarahkan karena terkadang Radit belum mau mengikuti instruksi terapis dan cenderung memilih aktivitas sesuai keinginannya.
Radit terlihat lebih tertarik bermain menggunakan puzzle bergambar, seperti puzzle buah, hewan, dan profesi. Sementara itu, Radit masih belum menunjukkan ketertarikan untuk bermain menggunakan kartu bergambar (flashcard). Radit juga tampak senang melakukan aktivitas terapi wicara sambil bermain di kolam bola. Radit menikmati aktivitas bermain dan melompat di dalam kolam bola.
Saat melakukan aktivitas melompat keluar dari kolam bola, ketika Radit hendak berdiri, bagian kepala Radit tidak sengaja sedikit terkena tower leader sehingga Radit sempat menangis. Setelah ditenangkan, Radit kembali bersedia mengikuti aktivitas terapi dan tampak happy hingga kegiatan selesai.
Secara keseluruhan, Radit cukup kooperatif dan menunjukkan ketertarikan yang lebih baik pada aktivitas terapi yang dikemas melalui kegiatan bermain. Radit masih membutuhkan arahan dan pendampingan terapis agar dapat mengikuti instruksi serta menyelesaikan aktivitas yang diberikan.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, V.m.c bermain puzzle",cukup koperatif 
9/16/2026 17:05:18,La Ode Muhammad Alvarendra Zayn Falah Muhlis (Zayn),"Eva Dwi Gusfianti, A.Md.TW",Terapi Wicara,"
Hari ini Zayn cukup kooperatif dan bersedia mengikuti aktivitas yang diberikan oleh terapis. Pada aktivitas V.M.C, Zayn bermain puzzle bergambar, kemudian diminta untuk menceritakan gambar yang terdapat pada puzzle menggunakan bahasa Zayn sendiri. Zayn cukup antusias dalam menceritakan gambar, dan Bu Eva mengarahkan Zayn untuk menggunakan susunan bahasa yang lebih baik dan benar.

Selama aktivitas terapi wicara, Zayn terlihat antusias dan cukup kooperatif. Namun, Zayn masih cenderung menggunakan echolalia sehingga beberapa respons perlu dikoreksi dan diarahkan oleh terapis agar sesuai dengan konteks pembicaraan.

Selanjutnya, dilakukan latihan bahasa ekspresif dan reseptif tingkat kata dengan menggunakan kata benda yang ada di sekitar. Pada aktivitas ini, terapis juga memberikan koreksi terhadap artikulasi Zayn agar pengucapan kata menjadi lebih jelas dan tepat.

Secara keseluruhan, Zayn menunjukkan antusiasme yang cukup baik selama mengikuti terapi. Zayn masih membutuhkan arahan dan koreksi secara konsisten untuk membantu meningkatkan kemampuan bahasa ekspresif, pemahaman, serta kejelasan artikulasinya.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Latihan Artikulasi tingkat kata",cukup koperatif 
9/16/2026 17:05:25,La Ode Muhammad Alvarendra Zayn Falah Muhlis (Zayn),Rodiah Arjuwani,Okupasi Terapi /SI,"Pada sesi terapi hari ini diawali dengan aktivitas exercise sebanyak 5x pengulangan untuk warming up, zayn mampu menyelesaikan dengan arahan verbal. Lalu zayn mengambil bola sesuai urutan warna yang diinstruksikan oleh terapis sebanyak 3 bola untuk melatih short term memory, zayn diarahkan dan butuh pengulangan sampai bola yang diambil sesuai. Kemudian zayn memindahkan bola dengan berjalan menjepit bola untuk melatih perencanaan gerak dan koordinasi bilateral, zayn mampu menyelesaikan meskipun gerakan masih pelan dan kompensasi satu tangan ketika gerakan mundur. Selanjutnya zayn berdiri pada balance board dan lempar tangkap bola sedang sebanyak 10x, zayn mampu mempertahankan posisi berdiri. Terakhir zayn menyelesaikan aktivitas menjelujur untuk melatih koordinasi bilateral handuse dan visual motor, zayn tampak rapi dan teliti saat menyelesaikan.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif 
9/16/2026 18:45:04,Aliyan Akhtar Raja Sulaiman (Raja),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Raja terapi SI pengganti dengan Tr. Velyn. Diawali dengan berdoa dan melakukan aktivitas :
1. Exercise sebanyak 10× repetisi
2. Penguatan core strength dgn aktv posisi plank dan berjalan pada pinggir kolam bola serta jalan jongkok
3. Optimalisasi gagasan ide dan pola pikir abstrak dengan bermain tebak-tebakan preposisi benda
4. Membuat kalimat S-P-O-K","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dan kooperatif dalam penyelesaian tahapan tugas
9/16/2026 18:48:38,Ibrahim Malik Reswara (Baim),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini (16 Sept 2026) Ibrahim belajar dengan cukup konsisten dan kooperatif, menyelesaikan tahapan tugas dengan tujuan meningkatkan core strength, ketahanan fokus atensi, serta inisiasi dalam beraktivitas. Aktivitas yang dilakukan antara lain :
1. Menyelesaikan tahapan obstacle pada perosotan dan step box
2. Berayun pada hammock dan memasukkan ring pada pasak
3. Memasukkan koin pada celengan dengan jepit","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup kooperarif dengan arahan minimal
9/16/2026 18:53:12,Zaydan Amartii Faaris (Zaydan),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Zaydan belajar dengan cukup konsisten dan kooperatif dalam penyelesain tahapan aktivitas. Inisiasi dan daya juang dalam aktivitas tingkatkan lagi. Aktivitas yang dilakukan meliputi :
1. Bermain tebak-tebakan berdasarkan clue, gagasan ide dan pola pikir abstrak cukup baik. Namum daya juang dalam aktv perlu dioptimalkan kembali
2. Menuliskan benda berdasarkan preposisi, visual atensi cukup baik dan konsisten dalam aktv
3. Menulis kalimat berdasarkan kata yang diberikan, pola penulisan S-P-O-K optimalkan kembali","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dan kooperatif
9/16/2026 18:58:05,Jan Aldari Elmaco (Jan),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Jan belajar dengan cukup konsisten dalam penyelesaian tugas, namun fokus atensi masih cenderung inatensi dan belum optimal pada durasi yang lebih lama. Aktivitas yang dilakukan meliputi :
1. Exercise 10× repetisi
2. Estafet ring bersama teman dengan posisi tangan bergandengan, kerja sama dalam team masih dengan arahan Tr. Velyn
3. Audio attention activities dengan instruksi bertahap, pola aktivitas belum optimal sepenuhnya. Jan cenderung inatensi sehingga respon yang diperoleh masih belum sesuai dengan tugas yang semestinya","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dengan arahan minimal
9/16/2026 19:00:33,Gorby Logan Siagian (Gorby),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Gorby belajar dengan cukup baik dan konsisten pada pola penyelesaian tugas. Inisiasi bermain bersama teman cukup baik, namun masih cenderung egosentrisme dan belum mau berbagi mainan dengan teman. Aktivitas yang dilakukan meliputi :
1. Exercise 5× repetisi
2. Melepas selotip pada hewan, daya juang aktivitas optimalkan kembali
3. Membuat kandang hewan dari magnetic tiles","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dengan arahan
9/16/2026 19:04:21,Syafia Rizti Qurrota (Qurrota),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Qurrota belajar dengan baik, inisiasi beraktivitas pada table top activities cukup namun daya juang dalam aktivitas optimalkan kembali. Aktivitas yang dilakukan meliputi :
1. Mengikuti gerakan senam sederhana
2. Mengerjakan worksheet 
a. Menentukan titik koordinat berdasarkan pola gambar
b. Teka teki silang (TTS) dengan tema profesi
c. Menuliskan ciri ciri hewan yang telah ditentukan, optimalkan gagasan ide saat beraktivitas","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup baik dan konsisten dengan arahan dan motivasi external dari terapis
9/16/2026 19:08:52,Attar Malik Ibrahim (Attar),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini Attar (15 Sept 2026) belajar dengan cukup konsisten dan kooperatif dalam tahap penyelesaian tugas kelompok bersama teman, inisiasi saat beraktivitas cukup baik dan mulai mau menjalin sosialisasi dengan teman meskipun belum mau mengeluarkan suara saat beraktivitas. Aktivitas yang dilakukan meliputi :
1. Exercise sebanyak 10× repetisi sesuai urutan
2. Menyeimbangkan tong pada papan bersama teman
3. Senam mengikuti gerakan pada video
","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dan kooperatif
9/16/2026 19:14:48,Giriandra Aryasena (Sena),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini (15 Sept 2026) Sena kurang optimal dalam penyelesaian tahapan aktivitas. Sena lebih aktif daripada biasanya, sehingga dalam penyelesaian tugas perlu arahan max. Sena banyak menabrakkan diri pada kolam bola, melompat terlalu tinggi pada trampolin dan bermain ayunan dengan cukup kencang. Aktivitas yang dilakukan meliputi
1. Melompat pada trampolin dan mengumpulkan bola
2. Memasang puzzle alfabet
3. Berlari kencang dan mengumpulkan jepit","Berdoa, Sensori Integrasi, Evaluasi",Cukup dengan arahan maximal
9/16/2026 19:19:06,Ibrahim Malik Reswara (Baim),"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini (15 Sept 2026) Ibrahim belajar dengan cukup konsisten dengan arahan minimal dalam penyelesaian tahapan tugas. Aktivitas yang dilakukan adalah :
1. Mendorong dan angkat+gulingkan tong, kekuatan otot dalam aktivitas perlu dioptimalkan dalam penyelesaian tugas
2. Memasang rubber bend pada toples, koordinasi dan kekuatan otot jari cukup berkembang
3. Menyelesaikan tahapan obstacle perosotan dan papan titian, optimalkan inisiasi pada penyelesaian tugas yang lebih panjang","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup konsisten dengan arahan minimal
9/17/2026 8:25:33,Damar Handaru (Damar),"Freniska Anggun Dwi Anggraini, AMd.Kes",Okupasi Terapi /SI,"Stimulasi fokus-atensi 
Pemahaman instruksi sederhana
Latihan penyelesaian tugas 
Stimulasi taktil, vestibular dan propioseptive dengan kegiatan :
- berjalan kaki outdoor (grounding)
- menyelesaikan  puzel
- berayun dengan variasi gerakan 
- memindahkan jepit 
Respon : damar lebih tenang dan lebih mau untuk menyelesaikan tugas yang diberikan oleh terapis, sensori taktil respon masih kurang nyaman, motor planing keseimbangan masih perlu ditingkatkan. ","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Bahasa Reseptif, Bahasa Ekspresif",Koperatif
9/17/2026 8:29:24,Naylufar Aufari Adilla (Lulu),"Freniska Anggun Dwi Anggraini, AMd.Kes",Okupasi Terapi /SI,"Stimulasi fokus atensi 
Pemahaman instruksi sederhana 
Inisiatif kegiatan cukup meningkat seperti mengajak terapis untuk bermain
Stimulasi input sensori dasar dengan kegitan
- steping chair dan melangkahi hulahop motor planing sudah lebih baik, body awarnes mulai muncul, keseimbangan lebih meningkat
- core akt dengan kegitan jongkok berdiri semi squad, gym ball akt endurance, kontrol postural masih peleu ditingkatkan 
- berjalan dikolam bola koordinasi bilateral, mampu merayap dengan mandiri dengan bertumpu pada tembok
- imitasi gerak sederhana coppy dan imitasi lebih konsisten 
","Berdoa, Sensori Integrasi, Aktivitas Terapeutik",Koperatif
9/17/2026 9:22:14,Kalandra Arfiendy Taufiq,"Rosavelyna Setya Maharani, S.Tr.Kes",Okupasi Terapi /SI,"Hari ini pertama kali Andra belajar dgn Tr. Velyn. Adaptasi dgn orang baru cukup baik, mendengarkan instruksi yang diberikan dengan aturan main yang cukup tegas. Andra belum terlalu konsisten untuk patuh dan tenang dalam beraktivitas, mudah bosan dalam penyelesaian tugas, beberapa kali mengeluh lelah agar tidak melanjutkan aktivitas. Aktivitas yang dilakukan Andra antara lain :
1. Estafet step chair dan berjalan dengan lutut sesuai instruksi yang diberikan
2. Memasang puzzle dengan aturan yang jelas
3. Aktivitas table top dengan tugas kategorisasi (buah yg rasanya asam, hewan berkaki 4, dll)
Daya juang dan inisiasi menyelesaikan tahapan tugas dengan durasi dan tugas yang lebih panjang belum konsisten sepenuhnya","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Cukup kooperatif dengan arahan minimal
9/17/2026 10:02:23,Enzo Abhinaya (Enzo),"Endang Setianingsih, A.Md.TW",Terapi Wicara,Dalam perkembangan,"Berdoa, Bahasa Reseptif, Bahasa Ekspresif",Cukup diarahkan
9/17/2026 10:56:15,Athalla Raffasha Pratama (Raffa),"Hana Tiarazzahira Kestadireja, A.Md.OT",Okupasi Terapi /SI,"Hari ini Raffa cukup kooperatif belajarnya, mau untuk mengikuti kegiatan yang diberikan dengan baik. Beberapa kali Raffa menangis karena belum menang saat aktivitas simon says, namun Raffa lebih bisa ditenangkan dengan baik. Muncul beberapa engagement terhadap Terapis lebih banyak. Fokus dan atensi saat belajar perlu ditingkatkan agar lebih mampu mempertahankan kontrol mata saat Terapis memberikan instruksi panjang.

1. Pre Act: obstacle exercise 7x
2. Rest & relax 10 menit
3. Estafet ring besar -> sambil berpegangan tangan
4. Simon says","Berdoa, Sensori Integrasi, Evaluasi, Aktivitas Kelompok",Kooperatif
9/17/2026 11:04:36,Fayzan Abiyyu Chandratyawan (Fayzan),"Hana Tiarazzahira Kestadireja, A.Md.OT",Okupasi Terapi /SI,"Hari ini Fayzan menunjukkan antusiasme yang baik saat belajar. Penyelesaian aktivitas dikerjakan dengan cukup baik walau beberapa kali perlu diarahkan untuk tetap tenang dan tidak terburu-buru. 2 dari 5 kesempatan tercatat karena Fayzan tidak responsif saat dipanggil berulang kali, dan terburu-buru saat sedang bermain cooperative games bersama teman sehingga task tidak terselesaikan dengan baik. Namun, Fayzan sudah lebih paham ketika diingatkan dan mau untuk lebih berhati-hati. Sempat sedih dan menangis karena merasa kurang maksimal, namun emosi telah tervalidasi dan Fayzan menjadi lebih tenang.

1. Obstacle exercise 10x
2. Duduk tenang 10 menit + diberi distraksi
3. Lomba menyeret bola dengan ring besar + berjalan 5 meter -> siapa yang paling banyak mendapatkan bola adalah pemenangnya
4. Membawa ring di perut + bola di atas kepala bersama teman -> menahan bola di punggung bersama teman","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi, Aktivitas Kelompok",Kooperatif 
9/17/2026 11:21:01,Qyuzee Muizzu Nelson Dermawan (Qyuzee),Fira Endra Devi,Terapi Wicara,"kartu bergambar - menamai, meniru ujaran terapis
bermain suction toys - memahami konsep warna dan instruksi sederhana
puzzle - mencocokan gambar sesuai bentuknya","Bahasa Reseptif, Bahasa Ekspresif","Ananda Qyuzee menunjukkan sikap yang cukup kooperatif selama kegiatan terapi berlangsung. Pada aktivitas kartu bergambar, Ananda mampu menamai gambar serta meniru ujaran yang dicontohkan oleh terapis dengan cukup baik. Saat bermain suction toys, Ananda menunjukkan pemahaman terhadap konsep warna dan mampu mengikuti instruksi sederhana yang diberikan. Pada aktivitas puzzle, Ananda mampu mencocokkan gambar sesuai dengan bentuknya dengan cukup baik. Secara keseluruhan, Ananda dapat mengikuti kegiatan yang diberikan dan menunjukkan partisipasi yang baik selama sesi terapi."
9/17/2026 11:38:29,Hadil Samer Abdelkareem (Dudu),Fira Endra Devi,Terapi Wicara,"kartu bergambar sebab - akibat
bermain pipecleaner - membuat kupu-kupu ","Bahasa Reseptif, Bahasa Ekspresif","Ananda Dudu menunjukkan partisipasi yang cukup baik selama kegiatan terapi berlangsung. Pada aktivitas kartu bergambar sebab-akibat, Ananda masih memerlukan arahan dan bantuan dari terapis untuk memahami hubungan antara suatu peristiwa dan akibat yang ditimbulkannya. Saat bermain pipe cleaner dengan membuat bentuk kupu-kupu, Ananda memerlukan latihan dan pendampingan dalam merespons instruksi yang diberikan karena pemahaman terhadap konsep kegiatan masih perlu dikembangkan. Ananda tetap berusaha mengikuti kegiatan yang diberikan dengan dukungan dan arahan dari terapis."
9/17/2026 11:55:22,Alexander Eren Mardhinata (Eren),Fira Endra Devi,Terapi Wicara,"bermain miniatur hewan - menamai, meiru ujaran/suara suara hewan
kartu bergambar (benda) - menamai dan memahami konsep kata benda,
kartu bergambar (hewan) - menamai dan memahami konsep dan jenis jenis hewan
bernyanyi
","Berdoa, Bahasa Reseptif, Bahasa Ekspresif","Ananda Eren menunjukkan partisipasi yang cukup baik selama kegiatan terapi berlangsung. Pada aktivitas bermain miniatur hewan, Ananda mampu menamai beberapa hewan serta meniru ujaran dan suara hewan dengan cukup baik. Pada kegiatan kartu bergambar kategori benda, Ananda mampu menamai gambar dan menunjukkan pemahaman yang cukup baik terhadap konsep kata benda. Pada kartu bergambar kategori hewan, Ananda mampu menamai gambar serta memahami konsep dan jenis-jenis hewan yang diperkenalkan. Saat kegiatan bernyanyi, Ananda dapat mengikuti lagu dengan cukup baik, namun masih memerlukan arahan dan stimulasi untuk menamai gambar atau objek yang berkaitan dengan materi yang dipelajari."
9/17/2026 12:14:09,Altair Devendra Wiedagdo (Altair),Fira Endra Devi,Terapi Wicara,"kartu bergambar sequence - bercerita
komunikasi 2 arah - tanya jawab sederhana
mencari benda sesuai instruksi yang diberikan","Berdoa, Bahasa Reseptif, Bahasa Ekspresif","Hari ini Ananda mengikuti kegiatan terapi bersama grup terapi dengan cukup baik. Ananda terlihat kooperatif, mau mengikuti arahan, serta berpartisipasi dalam kegiatan yang diberikan. Pada aktivitas kartu bergambar sequence, Ananda mampu menceritakan urutan gambar sederhana dengan bantuan dan arahan dari terapis. Dalam kegiatan komunikasi dua arah melalui tanya jawab sederhana, Ananda sudah menunjukkan kemampuan merespons pertanyaan yang diberikan dengan cukup baik. Selain itu, pada aktivitas mencari benda sesuai instruksi, Ananda mampu mengikuti instruksi dan menemukan benda yang diminta dengan cukup baik."
9/17/2026 12:31:48,Askara Hafidz Praditya (Askara),Fira Endra Devi,Terapi Wicara,"kartu bergambar - bercerita
komunikasi 2 arah - tanya jawab sederhana
konsep tanya (kenapa) untuk memahami konsep sebab akibat 
","Berdoa, Bahasa Reseptif, Bahasa Ekspresif","Hari ini Ananda Askara mengikuti kegiatan terapi dengan cukup baik dan kooperatif. Pada aktivitas kartu bergambar, Ananda masih memerlukan arahan untuk menceritakan isi gambar sederhana, Dalam kegiatan komunikasi dua arah melalui tanya jawab sederhana, Ananda membutuhkan waktu untuk merespon dan memahami instruksi atau pertanyaan yang diberikan.

Untuk pemahaman konsep pertanyaan ""kenapa"" (sebab-akibat), Ananda mulai menunjukkan kemampuan memahami hubungan antara suatu kejadian dan penyebabnya, namun masih memerlukan bantuan serta arahan dari terapis dalam memberikan jawaban yang sesuai. Kemampuan ini masih perlu dilatih secara berulang, terutama melalui berbagai situasi dan kondisi yang dekat dengan pengalaman sehari-hari, agar pemahaman konsep sebab-akibat semakin berkembang dan dapat diterapkan secara lebih mandiri."
9/17/2026 19:26:20,Kalandra Arfiendy Taufiq,Rodiah Arjuwani,Okupasi Terapi /SI,"Pada sesi terapi hari ini Andra cukup kooperatif mau diarahkan untuk menyelesaikan aktivitas dan kepatuhan saat aktivitas cukup baik. Negosiasi tidak terlalu banyak. Sempat teriak menangis sebentar karena malu saat naik kursi untuk aktivitas lempar bola ke ring, Andra meleset dan malu akhirnya teriak namun tetap diarahkan untuk tenang dan diarahkan untuk regulasi emosi dengan tepat. Saat aktivitas lempar bola ke ring posisi berdiri di atas kursi kecil, Andra mampu menyelesaikan dengan beberapa kali pengulangan. Kemudian Andra berjalan melewati halang rintang ring dan meronce sebanyak 7x pengulangan, Andra mampu mengikuti sesuai aturan dengan timer selama 7 menit dan mampu menyelesaikan sebelum waktu habis. Selanjutnya Andra memanjat tower ladder lalu mengambil jepitan yang menempel pada tali di atas, Andra mampu menyelesaikan secara mandiri. Kepatuhan untuk merapikan mainan setelah selesai bermain mau mengikuti. ","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif 
9/18/2026 8:49:27,Pradipta Aska Diriga (Riga),Inggreat Rahmawanty,Okupasi Terapi /SI,Hari ini riga terlihat kurang bersemangat dan fokus. Bermain bersama teman dan menunggu giliran cukup baik hari ini. ,"Berdoa, Sensori Integrasi, Aktivitas Terapeutik",Cukup dapat diarahkan 
9/18/2026 8:50:03,Enzo Abhinaya (Enzo),"Siti Anjartini, A.Md. OT, S.Tr.Kes",Okupasi Terapi /SI,"- Berdiri di papan keseimbangan sambil menangkis bola dengan tongkat ke arah target
- Lompat mundur dengan pola buka-tutup sambil menyusun puzzle
- Merangkak ke depan sambil membawa cone di atas punggung
- Membuat rumah menggunakan magnetic tiles","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi","Hari ini Enzo cukup kooperatif dan mampu mengikuti instruksi yang diberikan. Namun, saat melakukan gerakan, Enzo masih terlihat terburu-buru sehingga beberapa gerakan dilakukan kurang terkontrol dan kurang memperhatikan ketepatan gerakan. Enzo masih membutuhkan pengingat verbal untuk memperlambat tempo, mengikuti tahapan gerakan, serta mempertahankan kontrol tubuh selama melakukan aktivitas.
"
9/18/2026 8:50:46,Nathan Alexander Bay (Nathan),Ruri Santi Hapsari,Terapi Wicara,"Hari ini Ananda Nathan belajar dengan cukup kooperatif, latihan fokus atensi dengan memancing ikan magnetik cukup responsif dan mau fokus, menirukan gerak dan motorik oral masih dengan bantuan, menirukan suara masih belum konsisten namun terus di stimulus dan ditingkatkan ","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral",Cukup kooperatif 
9/18/2026 9:55:02,Shadiq Alfarezi (Shadiq),"Eva Dwi Gusfianti, A.Md.TW",Terapi Wicara,"Hari ini Shadiq mengikuti kegiatan terapi wicara dengan suasana yang sangat menyenangkan. Kegiatan diawali dengan grounding bersama teman-teman terapi lainnya, dengan aktivitas melihat bebek dan bermain di playground. Saat melihat bebek maupun ketika bermain di rumput, sesekali Shadiq menatap Bu Eva, seolah ingin menyampaikan atau menanyakan “ini apa?”. Bu Eva kemudian memberikan stimulasi dengan menyebutkan nama benda yang dilihat, seperti “bebek” dan “rumput”. Alhamdulillah, Shadiq sempat menunjukkan respons verbal secara spontan dengan mengucapkan kata “bebek” dan “apa”.
Setelah itu, kegiatan dilanjutkan di dalam ruangan dengan oral motor exercise, latihan meniup, serta latihan vokalisasi /a/, /i/, /u/, /e/, dan /o/. Shadiq cukup kooperatif dalam mengikuti aktivitas yang diberikan oleh terapis.
Selanjutnya, Shadiq melakukan latihan ekspresif dan reseptif mengenai anggota keluarga dan anggota tubuh, serta latihan pemahaman dengan bantuan atau prompt maksimal dari terapis. Secara keseluruhan, Shadiq mengikuti kegiatan dengan baik dan terlihat sangat happy selama sesi terapi. Respons Shadiq untuk melihat dan berbagi perhatian dengan Bu Eva juga mulai tampak ketika menemukan sesuatu yang menarik baginya.","Berdoa, Bahasa Reseptif, Bahasa Ekspresif, Motorik Oral, v.m.c bermain puzzle buah dan hewan",cukup koperatif 
9/18/2026 10:49:27,Ahmad Putra Raffasya Wiratama (Ahmad),Fira Endra Devi,Terapi Wicara,"Puzzle abstrak - memasang puzzle, mencari puzzle
Bermain section toys- konsep warna
Menamai - meniru ujaran terapis","Berdoa, Bahasa Reseptif, Bahasa Ekspresif","Selama sesi, anak cukup kooperatif dalam mengikuti kegiatan. Pada aktivitas puzzle abstrak (memasang dan mencari puzzle), anak masih memerlukan arahan serta latihan berulang untuk menyelesaikan tugas secara lebih mandiri.

Pada aktivitas section toys dengan konsep warna, kemampuan mengenali dan memahami warna masih inkonsisten, sehingga membutuhkan prompting dan pengulangan.

Pada aktivitas menamai dan meniru ujaran terapis, anak masih memerlukan arahan untuk memberikan respons yang sesuai serta meniru ujaran dengan tepat."
9/18/2026 10:52:00,Adnan Lutfan Malik (Adnan),Fira Endra Devi,Terapi Wicara,"Puzzle abstrak - memasang dan mencari gambar
Section toys - konsep warna , mengambil sesuai instruksi
Menamai - meniru ujaran","Berdoa, Bahasa Reseptif, Bahasa Ekspresif","Selama sesi, anak cukup kooperatif dalam mengikuti kegiatan. Pada aktivitas puzzle abstrak (memasang dan mencari puzzle), anak masih memerlukan arahan serta latihan berulang untuk menyelesaikan tugas secara lebih mandiri.

Pada aktivitas section toys dengan konsep warna, kemampuan mengenali dan memahami warna masih inkonsisten, sehingga membutuhkan prompting dan pengulangan.

Pada aktivitas menamai dan meniru ujaran terapis, anak masih memerlukan arahan untuk memberikan respons yang sesuai serta meniru ujaran dengan tepat."
9/18/2026 11:08:26,Altair Devendra Wiedagdo (Altair),Dara Kinanti,Okupasi Terapi /SI,"Sesi terapi hari ini diawali dengan latihan mengelilingi ruang SI sebanyak 10 kali putaran dan dilanjutkan dengan Immersive Interactive Warming Up. Aktivitas pemanasan ini bertujuan untuk merangsang regulasi diri, meningkatkan kesiapan tubuh, serta memfokuskan perhatian Altair sebelum masuk ke tugas utama.
Selanjutnya, Altair berpartisipasi dalam aktivitas kelompok dengan dua fokus latihan:
1 Memegang Bola Bersama Teman & Mempertahankan Ring di Perut: Bertujuan untuk meningkatkan kesadaran tubuh (body awareness), perencanaan gerak (praxis), kontrol postur tubuh, serta keterampilan bekerja sama dan berinteraksi sosial dengan teman sebaya.

2 Simon Says Mengambil Bola: Bertujuan untuk meningkatkan pemrosesan pendengaran (auditory processing), pemahaman instruksi, integrasi visual-motorik, serta kontrol impuls (self-regulation).

Selama sesi berlangsung, Altair menunjukkan partisipasi yang cukup baik, meskipun masih membutuhkan pengingat (prompting/re-direction) dari terapis untuk menjaga fokusnya tetap tertuju pada aktivitas yang sedang dilakukan.","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi, Group Therapy",Kooperatif dengan Arahan
9/18/2026 11:37:12,Allen Ismail Wardhana (Allen),"Hana Tiarazzahira Kestadireja, A.Md.OT",Okupasi Terapi /SI,"Hari ini Allen cukup kooperatif belajarnya, walau beberapa kali diarahkan dalam ketahanan atensinya saat menyelesaikan tugas.

1. Pre Act: RMT
2. Ambil kartu sesuai ciri-ciri yang diberikan -> lompat maju ke dalam hula hoop
3. Table top: maze & dot to dot
4. ADL: pakai celana secara mandiri (perlu ditingkatkan)","Berdoa, Sensori Integrasi, Aktivitas Terapeutik, Evaluasi",Kooperatif `;

// Function to parse the raw CSV into Students and TherapySessions
export function parseInitialPelangiData(): {
  students: Student[];
  sessions: TherapySession[];
} {
  // Simple robust CSV parser that respects quoted fields with newlines
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < RAW_PELANGI_CSV.length; i++) {
    const char = RAW_PELANGI_CSV[i];
    const nextChar = RAW_PELANGI_CSV[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  // Skip header row
  const dataRows = rows.slice(1);

  const studentMap = new Map<string, Student>();
  const sessions: TherapySession[] = [];

  dataRows.forEach((cols, idx) => {
    if (cols.length < 5) return;
    const rawTimestamp = cols[0] || '';
    const rawStudent = cols[1] || '';
    const rawTherapist = cols[2] || '';
    const rawTherapy = cols[3] || '';
    const rawProgress = cols[4] || '';
    const rawIntervention = cols[5] || '';
    const rawResponse = cols[6] || '';

    const parsedDate = parseTimestampOrDate(rawTimestamp);
    const parsedName = parseStudentName(rawStudent);

    // Normalize student key by full name
    const studentKey = parsedName.fullName.toLowerCase();
    let student = studentMap.get(studentKey);

    if (!student) {
      const studentId = `std_${studentKey.replace(/[^a-z0-9]/g, '_')}_${String(studentMap.size + 1).padStart(3, '0')}`;
      student = {
        student_id: studentId,
        student_name: rawStudent, // Keep original e.g. "Adnan Lutfan Malik (Adnan)"
        nickname: parsedName.nickname,
        custom_id: `RM-${2026}-${String(studentMap.size + 1).padStart(3, '0')}`,
        created_at: new Date('2026-09-01T08:00:00.000Z').toISOString(),
        updated_at: new Date('2026-09-18T12:00:00.000Z').toISOString(),
        is_deleted: false,
      };
      studentMap.set(studentKey, student);
    }

    const hash = generateSessionHash(
      parsedDate.dateStr,
      rawStudent,
      rawTherapist,
      rawTherapy,
      rawProgress,
      rawIntervention,
      rawResponse
    );

    const session: TherapySession = {
      session_id: `ses_pelangi_${idx + 1}`,
      student_id: student.student_id,
      student_name: rawStudent,
      nickname: parsedName.nickname,
      date: parsedDate.dateStr,
      time_str: parsedDate.timeStr,
      raw_timestamp: rawTimestamp,
      therapist_name: rawTherapist,
      therapy_type: rawTherapy,
      session_progress: rawProgress,
      intervention_program: rawIntervention,
      child_response: rawResponse,
      signature_hash: hash,
      is_deleted: false,
      created_at: new Date(`2026-09-16T${parsedDate.timeStr || '09:00'}:00.000Z`).toISOString(),
      updated_at: new Date(`2026-09-16T${parsedDate.timeStr || '09:00'}:00.000Z`).toISOString(),
    };

    sessions.push(session);
  });

  return {
    students: Array.from(studentMap.values()),
    sessions,
  };
}
