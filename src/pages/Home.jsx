import { useEffect } from "react";
import { Link } from "react-router-dom";
import CircularGallery from "../components/CircularGallery";
import yslBlack from "../assets/73bfcb46ab4837ac2a4eaf88412e3325.jpg";
import strongerWithYou from "../assets/35db46d726f6a8ef9c99e1c45275135e.jpg";
import dImage from "../assets/d.jpg";
import {
  warmupFirstProductsPage,
  warmupProductsPoolInBackground,
} from "../utils/productsWarmup";

const heroImages = [
  {
    name: "YSL",
    url: strongerWithYou,
  },
  {
    name: "Le Beau",
    url: dImage,
  },
  {
    name: "Stronger With You",
    url: yslBlack,
  },
];

const galleryItems = [
  {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Coco_mademoiselle.jpg",
    text: "Coco Mademoiselle",
  },
  {
    image: "https://p0.piqsels.com/preview/538/579/644/bleu-de-chanel-eau-de-parfum-bottle.jpg",
    text: "Bleu de Chanel",
  },
  {
    image: yslBlack,
    text: "Stronger With You",
  },
  {
    image: dImage,
    text: "Le Male",
  },
  {
    image: strongerWithYou,
    text: "YSL",
  },
];

const Home = () => {
  useEffect(() => {
    // 1) Load first page fast for instant Homme/Femme navigation.
    Promise.allSettled([
      warmupFirstProductsPage({ gender: "HOMME", sort: "price,asc" }),
      warmupFirstProductsPage({ gender: "FEMME", sort: "price,asc" }),
    ]).then(() => {
      // 2) Then continue loading remaining pages progressively in background.
      warmupProductsPoolInBackground({ gender: "HOMME", sort: "price,asc" });
      warmupProductsPoolInBackground({ gender: "FEMME", sort: "price,asc" });
    });
  }, []);

  return (
    <div className="page">
      <div className="hero hero-dynamic">
        <div className="hero-content">
          <p className="eyebrow">Collection 2026</p>
          <h1>Kadiri Parfum</h1>
          <p>Decouvrez des parfums premium pour lui et elle.</p>
        </div>
        <div className="hero-bottles">
          <div className="hero-images">
            {heroImages.map((item, idx) => (
              <img
                key={item.name}
                className={`bottle-img b${idx + 1}`}
                src={item.url}
                alt={item.name}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="highlights">
        <div className="highlight-card">
          <h3>Livraison rapide</h3>
          <p>Commande preparee et envoyee rapidement.</p>
        </div>
        <div className="highlight-card">
          <h3>Parfums authentiques</h3>
          <p>Selection premium de marques originales.</p>
        </div>
        <div className="highlight-card">
          <h3>Conseil boutique</h3>
          <p>Une equipe a votre ecoute en magasin.</p>
        </div>
      </section>

      <section className="split">
        <div className="split-card split-homme">
          <h2>Homme</h2>
          <p>Boise, cuir, epice.</p>
          <Link className="btn btn-primary" to="/homme">Explorer Homme</Link>
        </div>
        <div className="split-card split-femme">
          <h2>Femme</h2>
          <p>Floral, doux, elegant.</p>
          <Link className="btn btn-primary" to="/femme">Explorer Femme</Link>
        </div>
      </section>

      <section className="brand-row">
        <h3>Marques populaires</h3>
        <div className="brand-pills">
          <span>Dior</span>
          <span>Chanel</span>
          <span>YSL</span>
          <span>Armani</span>
          <span>Givenchy</span>
        </div>
      </section>

      <section className="home-gallery">
        <CircularGallery
          items={galleryItems}
          bend={1}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.05}
        />
      </section>

      <section className="contact-card">
        <div>
          <h2>Nous trouver</h2>
          <p className="muted contact-strong">
            WM94+MC7 marjane, Boulevard Mohammed V, Sidi Slimane Echcharaa, Berkane
          </p>
          <p className="muted contact-strong">Tel: +212 5 36 25 60 18</p>
        </div>
        <div className="contact-actions">
          <a
            className="btn btn-maps"
            href="https://maps.app.goo.gl/tVDxQY9fnzhm1gLu7"
            target="_blank"
            rel="noreferrer"
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M12 2c3.86 0 7 3.14 7 7 0 5.3-7 13-7 13s-7-7.7-7-13c0-3.86 3.14-7 7-7zm0 3.5A3.5 3.5 0 1 0 12 16a3.5 3.5 0 0 0 0-7z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Google Maps
          </a>
          <a
            className="btn btn-instagram"
            href="https://www.instagram.com/para_pharmaciekadiri/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.25-3.5a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.25 6z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Instagram
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
