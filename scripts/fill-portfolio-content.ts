/**
 * One-off content pass: improves the wording of every portfolio entry and
 * fills the case-study fields (problem / solution / results) that the public
 * project detail view renders. Run with:
 *   npx ts-node scripts/fill-portfolio-content.ts
 *
 * Matching is by the existing `slug` so it is safe to re-run (idempotent).
 * Slugs and relations (tags/tech/images/category) are left untouched.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

interface Content {
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  problem: string;
  solution: string;
  results: string;
}

const CONTENT: Content[] = [
  {
    slug: 'news-portal-berita',
    title: 'News Portal — Portal Berita & Analisis',
    shortDesc:
      'Portal berita modern yang menyajikan kabar terkini dan analisis mendalam lintas bidang: politik, ekonomi, hiburan, dan teknologi.',
    description:
      'News Portal adalah platform media digital yang menyajikan berita terkini beserta analisis mendalam dari berbagai rubrik—politik, ekonomi, hiburan, dan teknologi. Pembaca dapat menelusuri artikel berdasarkan kategori, mengikuti topik favorit, dan menikmati pengalaman membaca yang cepat serta responsif di semua perangkat.',
    problem:
      'Redaksi membutuhkan satu kanal terpusat untuk menerbitkan berita lintas rubrik secara cepat, sementara pembaca kesulitan menemukan artikel yang relevan karena konten tersebar tanpa kategorisasi yang rapi.',
    solution:
      'Saya membangun portal berita full-stack dengan Laravel: panel redaksi untuk publikasi dan kategorisasi artikel, halaman publik dengan navigasi per rubrik, pencarian, dan tata letak responsif yang dioptimalkan untuk keterbacaan dan kecepatan muat.',
    results:
      'Proses publikasi artikel menjadi lebih terstruktur dan cepat, pembaca dapat menemukan konten relevan melalui kategori dan pencarian, serta halaman tetap ringan dan nyaman diakses dari desktop maupun mobile.',
  },
  {
    slug: 'mini-discord',
    title: 'Mini Discord — Chat, Voice & Video Real-time',
    shortDesc:
      'Platform komunikasi terinspirasi Discord dengan pesan real-time, panggilan suara, dan video dalam satu aplikasi yang ringan.',
    description:
      'Mini Discord adalah aplikasi komunikasi real-time yang terinspirasi oleh Discord, menghadirkan pesan instan, panggilan suara, dan video. Pengguna dapat membuat ruang percakapan, berkirim pesan secara langsung, serta memulai panggilan dengan latensi rendah—seluruhnya berjalan mulus di browser.',
    problem:
      'Membangun pengalaman komunikasi real-time yang andal—pesan instan sekaligus panggilan suara/video—menuntut sinkronisasi state yang presisi dan koneksi berlatensi rendah, tantangan utama pada aplikasi berbasis web.',
    solution:
      'Saya mengembangkan platform dengan Next.js, TypeScript, dan Express, memakai Socket.IO untuk pesan dan signaling real-time, TanStack Query untuk sinkronisasi data, NextAuth untuk autentikasi, serta Shadcn UI dan Framer Motion untuk antarmuka yang halus dan responsif.',
    results:
      'Pengguna dapat berkirim pesan, melakukan panggilan suara, dan video secara real-time dengan pengalaman yang mendekati aplikasi native, sekaligus membuktikan arsitektur web real-time yang skalabel dan dapat dikembangkan.',
  },
  {
    slug: 'ppa-photo-proof-app',
    title: 'PPA — Photo Proof App',
    shortDesc:
      'Aplikasi pencatatan aktivitas karyawan perkebunan berbasis bukti foto agar mudah dipantau dan diaudit.',
    description:
      'Photo Proof App (PPA) adalah aplikasi untuk mencatat beragam aktivitas karyawan perkebunan disertai bukti foto. Setiap aktivitas terekam rapi sehingga manajemen dapat memantau, memverifikasi, dan mengaudit pekerjaan lapangan dengan mudah dan transparan.',
    problem:
      'Pencatatan aktivitas karyawan perkebunan masih manual dan sulit diverifikasi, sehingga manajemen kesulitan memastikan pekerjaan benar-benar dilakukan di lapangan.',
    solution:
      'Saya membangun layanan backend dengan .NET dan SQL Server yang menyediakan API untuk mencatat aktivitas beserta bukti foto, lengkap dengan struktur data yang mendukung pemantauan dan pelaporan per jenis aktivitas.',
    results:
      'Aktivitas lapangan kini terdokumentasi dengan bukti foto yang dapat diverifikasi, mempermudah kontrol manajemen, meningkatkan akuntabilitas karyawan, dan mengurangi potensi pencatatan fiktif.',
  },
  {
    slug: 'PSAWEB - Peta Online (survei web GIS)',
    title: 'PSAWEB — Peta Online Survei GIS Perkebunan',
    shortDesc:
      'Web GIS untuk inspeksi dan pemutakhiran status patok batas wilayah kebun dengan peta interaktif berlapis.',
    description:
      'PSAWEB adalah aplikasi web GIS untuk menginspeksi titik patok batas wilayah kebun. Setiap periode tahunan, tim lapangan memperbarui status patok melalui peta interaktif yang dilengkapi basemap OpenStreetMap serta beragam layer—jalan, blok, pohon sawit, dan patok batas—sehingga kondisi batas wilayah selalu termutakhir.',
    problem:
      'Inspeksi batas wilayah kebun yang luas sulit dikelola tanpa peta digital terpusat; status patok batas yang diperbarui secara manual rawan tidak konsisten dan sulit dipantau lintas periode.',
    solution:
      'Saya membangun web GIS dengan Next.js, Express, dan TypeScript di atas SQL Server, menggunakan Leaflet untuk peta interaktif berlapis (jalan, blok, pohon, patok batas) yang memungkinkan tim memperbarui status patok langsung dari lapangan.',
    results:
      'Tim inspeksi dapat memutakhirkan status patok batas secara terpusat dan visual, memetakan kondisi batas wilayah dengan akurat setiap periode, serta mempercepat pengambilan keputusan terkait pengelolaan lahan.',
  },
  {
    slug: 'RKB/RKT - Rencana Kerja Bulanan atau tahunan',
    title: 'RKB/RKT — Rencana Kerja Bulanan & Tahunan',
    shortDesc:
      'Aplikasi penyusunan, pengunggahan, dan validasi rencana kerja bulanan & tahunan yang terintegrasi dengan SAP.',
    description:
      'RKB/RKT adalah aplikasi web untuk menyusun, mengunggah, dan memvalidasi rencana kerja bulanan maupun tahunan—mencakup Harvesting, Upkeep, hingga Contract. Dilengkapi filter periode per bulan dan tabel rekapitulasi yang rapi, serta terhubung langsung dengan SAP untuk konsistensi data perencanaan.',
    problem:
      'Penyusunan rencana kerja bulanan dan tahunan perkebunan melibatkan banyak kategori pekerjaan dan periode, sehingga proses manual sulit divalidasi dan rawan tidak selaras dengan data SAP.',
    solution:
      'Saya mengembangkan aplikasi dengan .NET dan SQL Server yang memungkinkan penyusunan dan pengunggahan rencana kerja per kategori dan periode, dilengkapi alur validasi serta integrasi dengan SAP agar data perencanaan tetap sinkron.',
    results:
      'Penyusunan RKB/RKT menjadi terstruktur dan terstandardisasi, validasi rencana lebih cepat, dan data perencanaan selaras dengan SAP sehingga mengurangi selisih dan pekerjaan ulang.',
  },
  {
    slug: 'MRIS - Material Reservation System Information',
    title: 'MRIS — Material Reservation System',
    shortDesc:
      'Sistem pengajuan dan pelacakan permintaan material ke gudang secara digital dengan alur approval berjenjang.',
    description:
      'MRIS adalah aplikasi web untuk pengajuan dan pelacakan permintaan material ke gudang secara digital (paperless). Karyawan kebun dapat me-request barang yang dibutuhkan, sementara pimpinan menyetujui melalui alur approval berjenjang—seluruh proses terekam dan mudah ditelusuri.',
    problem:
      'Permintaan material ke gudang masih berbasis kertas, membuat proses pengajuan dan persetujuan lambat, sulit dilacak, dan rawan kehilangan dokumen.',
    solution:
      'Saya membangun MRIS dengan .NET dan SQL Server, terintegrasi dengan Oracle dan SAP, menyediakan formulir pengajuan material, alur approval berjenjang untuk pimpinan, serta pelacakan status permintaan secara real-time.',
    results:
      'Proses permintaan material menjadi paperless, persetujuan lebih cepat dan transparan, status pengajuan dapat dipantau setiap saat, serta data permintaan terintegrasi dengan sistem gudang dan ERP perusahaan.',
  },
  {
    slug: 'EventKu - Penyedia tiket untuk semua acara',
    title: 'EventKu — Platform Tiket & Event',
    shortDesc:
      'Platform untuk menemukan dan membuat event—dari konser hingga workshop—lengkap dengan tiket digital.',
    description:
      'EventKu adalah platform untuk menemukan dan membuat beragam event, mulai dari konser hingga workshop. Pengguna dapat menelusuri acara sesuai minat dan lokasi, membeli tiket digital, sementara penyelenggara dapat membuat dan mengelola event beserta sistem tiketingnya secara mandiri.',
    problem:
      'Penyelenggara acara kesulitan menjual dan mengelola tiket secara digital, sedangkan calon peserta sulit menemukan event yang sesuai minat dan lokasi mereka.',
    solution:
      'Saya membangun platform full-stack dengan Next.js, TypeScript, dan Express di atas PostgreSQL, dengan penyimpanan media di S3 dan TanStack Query untuk sinkronisasi data—mencakup pencarian event, pembuatan acara, dan tiketing digital.',
    results:
      'Penyelenggara dapat menerbitkan dan mengelola tiket acara secara mandiri, peserta menemukan event relevan dengan cepat, dan transaksi tiket berlangsung sepenuhnya digital dalam satu platform terpadu.',
  },
  {
    slug: 'The European Union on Deforestation-free Regulation (EUDR )',
    title: 'EUDR — Platform Informasi Kepatuhan Deforestasi UE',
    shortDesc:
      'Platform informasi dan panduan kepatuhan terhadap European Union Deforestation-free Regulation (EUDR).',
    description:
      'Website ini adalah platform informasi dan panduan terkait European Union Deforestation-free Regulation (EUDR)—regulasi Uni Eropa untuk mencegah peredaran produk yang berkontribusi pada deforestasi. Platform membantu pelaku usaha memahami persyaratan, kewajiban, dan langkah kepatuhan agar komoditas seperti kayu, kelapa sawit, kopi, kakao, karet, kedelai, dan daging sapi tidak berasal dari lahan deforestasi.',
    problem:
      'Pelaku usaha ekspor menghadapi regulasi EUDR yang kompleks dan terus berkembang, namun belum ada sumber terpusat yang menjelaskan persyaratan dan langkah kepatuhan secara jelas.',
    solution:
      'Saya membangun platform informasi dengan React (Vite), Express, dan TypeScript di atas PostgreSQL, menyajikan panduan kepatuhan, ringkasan kewajiban per komoditas, dan materi edukasi yang mudah dipahami pelaku usaha.',
    results:
      'Pelaku usaha memperoleh pemahaman yang lebih jelas mengenai kewajiban EUDR dan langkah kepatuhannya, sehingga lebih siap memenuhi persyaratan ekspor ke pasar Uni Eropa.',
  },
  {
    slug: 'AI RAG SISTEM',
    title: 'AI RAG System — Pencarian Cerdas Berbasis Dokumen',
    shortDesc:
      'Platform AI dengan metode Retrieval-Augmented Generation untuk mencari dan mengolah informasi dari beragam sumber secara akurat.',
    description:
      'AI RAG System adalah platform berbasis kecerdasan buatan yang menggunakan metode Retrieval-Augmented Generation (RAG) untuk mencari, mengambil, dan mengolah informasi dari berbagai sumber data. Sistem menghasilkan jawaban relevan berdasarkan dokumen, basis data, atau sumber lain—cocok untuk kebutuhan bisnis, customer service, knowledge management, hingga analisis data.',
    problem:
      'Pencarian informasi dari dokumen dan basis data yang besar memakan waktu dan rawan kesalahan, sementara jawaban dari AI generatif murni sering tidak akurat karena tidak berbasis data perusahaan.',
    solution:
      'Saya membangun sistem RAG dengan frontend React (Vite) dan backend Golang di atas PostgreSQL, memadukan pengambilan dokumen relevan dengan model generatif sehingga setiap jawaban berlandaskan data yang valid dan terstruktur.',
    results:
      'Pengguna memperoleh jawaban yang akurat dan kontekstual berdasarkan sumber data yang sah, mempercepat pencarian informasi, meningkatkan efisiensi kerja, dan menekan risiko misinformasi.',
  },
  {
    slug: 'JobHuntly',
    title: 'JobHuntly — Platform Pencari Kerja & Rekrutmen',
    shortDesc:
      'Marketplace lowongan kerja: perusahaan mengelola lowongan, pencari kerja mencari, melamar, dan memantau lamaran.',
    description:
      'JobHuntly adalah platform pencarian kerja dua sisi. Perusahaan dapat membuat serta mengelola lowongan dan menyaring pelamar, sementara pencari kerja dapat menelusuri lowongan, melamar, dan memantau status lamaran mereka dengan mudah dalam satu antarmuka yang intuitif.',
    problem:
      'Proses rekrutmen sering terpecah antara banyak kanal: perusahaan sulit mengelola lowongan dan pelamar, sedangkan pencari kerja kewalahan memantau lamaran yang tersebar.',
    solution:
      'Saya membangun platform full-stack dengan Next.js, TypeScript, dan Express di atas MongoDB, memakai TanStack Query untuk data, serta Shadcn UI dan Framer Motion untuk antarmuka—mencakup manajemen lowongan bagi perusahaan dan alur lamaran bagi pencari kerja.',
    results:
      'Perusahaan dapat memublikasikan dan mengelola lowongan beserta pelamar dalam satu tempat, sementara pencari kerja melamar dan memantau status lamaran dengan jelas, sehingga proses rekrutmen menjadi lebih efisien bagi kedua pihak.',
  },
  {
    slug: 'explore-blog',
    title: 'Explorer — Blog Pribadi',
    shortDesc:
      'Blog pribadi untuk berbagi catatan dan pengalaman seputar dunia pemrograman dan teknologi.',
    description:
      'Explorer adalah blog pribadi yang saya bangun untuk berbagi cara, catatan, dan pengalaman seputar dunia pemrograman maupun topik lain yang menarik. Platform ini dirancang ringan, cepat, dan nyaman dibaca, lengkap dengan manajemen konten mandiri.',
    problem:
      'Saya membutuhkan kanal pribadi untuk mendokumentasikan dan membagikan pengetahuan pemrograman, dengan kontrol penuh atas konten serta pengalaman membaca yang baik.',
    solution:
      'Saya membangun blog dengan Next.js, TypeScript, dan Express di atas PostgreSQL (Prisma), memakai NextAuth untuk autentikasi, Zustand untuk state, TanStack Query untuk data, serta Shadcn UI dan Framer Motion untuk tampilan yang rapi dan interaktif.',
    results:
      'Saya kini memiliki platform mandiri untuk menerbitkan tulisan dengan cepat, mengelola konten sepenuhnya, dan menghadirkan pengalaman membaca yang nyaman bagi pengunjung.',
  },
  {
    slug: 'payment-gateway-tnos-app',
    title: 'Payment Gateway — TNOS App',
    shortDesc:
      'Integrasi pembayaran TNOS App dengan Xendit: kartu kredit, transfer bank, e-wallet, dan QR code.',
    description:
      'Payment Gateway TNOS App memudahkan pembayaran melalui beragam metode yang didukung Xendit—kartu kredit, transfer bank, e-wallet, hingga QR code. Modul ini menangani alur pembayaran ujung-ke-ujung, mulai dari pembuatan transaksi hingga konfirmasi status secara otomatis.',
    problem:
      'TNOS App membutuhkan kanal pembayaran yang fleksibel dan andal dengan banyak metode, namun integrasi payment gateway yang aman dan konsisten dengan status transaksi cukup kompleks.',
    solution:
      'Saya mengintegrasikan Xendit ke dalam ekosistem TNOS menggunakan Laravel di sisi backend dan Next.js (TypeScript) di sisi frontend, dengan MariaDB, menangani pembuatan transaksi, beragam metode pembayaran, serta webhook untuk pembaruan status otomatis.',
    results:
      'Pengguna dapat membayar melalui berbagai metode dengan lancar, status pembayaran terkonfirmasi secara otomatis dan akurat, serta proses transaksi menjadi lebih aman dan andal.',
  },
  {
    slug: 'pwa-tnos-app',
    title: 'PWA TNOS App — Pendampingan & Konsultasi 24/7',
    shortDesc:
      'Progressive Web App pendampingan dan konsultasi siaga 24/7 agar pengguna merasa lebih aman di mana pun.',
    description:
      'PWA TNOS adalah aplikasi pendampingan dan konsultasi yang siap siaga 24/7, dibangun sebagai Progressive Web App agar dapat diakses layaknya aplikasi native langsung dari browser. Aplikasi membantu pengguna merasa lebih aman dan nyaman di mana pun mereka berada, dilengkapi integrasi lokasi.',
    problem:
      'Pengguna membutuhkan layanan pendampingan dan konsultasi yang selalu tersedia dan mudah diakses tanpa harus memasang aplikasi dari app store.',
    solution:
      'Saya membangun PWA dengan Next.js dan TypeScript, didukung backend Laravel dan MariaDB, mengintegrasikan Google Maps untuk fitur berbasis lokasi serta Shadcn UI untuk antarmuka yang konsisten—dapat dipasang dan diakses 24/7 dari perangkat apa pun.',
    results:
      'Pengguna dapat mengakses layanan pendampingan kapan saja layaknya aplikasi native tanpa instalasi dari app store, dengan dukungan lokasi yang meningkatkan rasa aman dan kenyamanan.',
  },
  {
    slug: 'ProFlow',
    title: 'ProFlow — Manajemen Proyek untuk Tim Cepat',
    shortDesc:
      'Alat manajemen proyek modern yang dirancang untuk tim yang bergerak cepat dan kolaboratif.',
    description:
      'ProFlow adalah alat manajemen proyek modern yang dibangun untuk tim yang bergerak cepat. Aplikasi membantu tim merencanakan pekerjaan, melacak progres, dan berkolaborasi dalam satu ruang kerja yang rapi—dengan antarmuka yang bersih dan responsif.',
    problem:
      'Tim yang bergerak cepat membutuhkan alat manajemen proyek yang ringan namun lengkap, karena banyak tools yang ada terlalu rumit atau lambat untuk alur kerja yang dinamis.',
    solution:
      'Saya membangun ProFlow sebagai aplikasi manajemen proyek modern dengan antarmuka yang bersih dan interaktif, berfokus pada perencanaan tugas, pelacakan progres, dan kolaborasi tim yang efisien.',
    results:
      'Tim dapat mengelola proyek dan tugas dalam satu ruang kerja yang terstruktur, memantau progres dengan jelas, dan berkolaborasi lebih cepat tanpa kerumitan tools yang berlebihan.',
  },
];

async function main() {
  let updated = 0;
  for (const c of CONTENT) {
    const existing = await db.portfolio.findUnique({ where: { slug: c.slug } });
    if (!existing) {
      console.warn(`SKIP (slug not found): ${c.slug}`);
      continue;
    }
    await db.portfolio.update({
      where: { slug: c.slug },
      data: {
        title: c.title,
        shortDesc: c.shortDesc,
        description: c.description,
        problem: c.problem,
        solution: c.solution,
        results: c.results,
      },
    });
    updated += 1;
    console.log(`OK  ${c.title}`);
  }
  console.log(`\nUpdated ${updated}/${CONTENT.length} portfolio entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
