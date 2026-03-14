import { Link } from "react-router-dom";
import CircularGallery from "../components/CircularGallery";
import perfume01 from "../assets/00c6dc5a4f3cccc08d662f95e9b79617.jpg";
import perfume02 from "../assets/0c1fb045e0d875e0d13764f81d74937a.jpg";
import perfume03 from "../assets/18d071aaacae4a774a970b98ff8a1950.jpg";
import yslBlack from "../assets/73bfcb46ab4837ac2a4eaf88412e3325.jpg";
import strongerWithYou from "../assets/35db46d726f6a8ef9c99e1c45275135e.jpg";
import perfume04 from "../assets/433a026c0d6921a6bc8065d71ff6d844.jpg";
import perfume05 from "../assets/7719eca5261e838519535dabe86ff56e.jpg";
import perfume06 from "../assets/9051b660d9c9b7d88217a22b8c8b1bdb.jpg";
import perfume07 from "../assets/967064efe00d7b1d75520adfc5f3b0c1.jpg";
import perfume08 from "../assets/b2d9096ad6b0ff60d2f63a3b075fae89.jpg";
import perfume09 from "../assets/b9c1667a2b1aab99fcd5955bd2dfcb9e.jpg";
import perfume10 from "../assets/bc486a84edca5229ef30b32f056286f2.jpg";
import dImage from "../assets/d.jpg";
import perfume11 from "../assets/f4cdc257ca25255777724b51594945ca.jpg";
import perfume12 from "../assets/f6e6bd17c5c15de9e568baeb797f2325.jpg";
import unisexImage from "../assets/mimi13.png";
import siteLogo from "../assets/site-logo.png";

const heroImages = [
  {
    name: "Stronger With You",
    url:  yslBlack,
  },
  {
    name: "Le Beau",
    url: perfume06,
  },
  {
    name: "Nina Rouge",
    url: perfume05,
  },
];

const galleryItems = [
  {
    image: perfume01,
    text: "Hypnotic Poison ",
  },
  {
    image: perfume02,
    text: "Le Male Elixir",
  },
  {
    image: perfume03,
    text: "Eros",
  },
  {
    image: strongerWithYou,
    text: "YSL",
  },
  {
    image: perfume04,
    text: "Black Orchid",
  },
  {
    image: yslBlack,
    text: "Stronger With You",
  },
  {
    image: perfume05,
    text: "Nina Rouge",
  },
  {
    image: perfume06,
    text: "The One",
  },
  {
    image: perfume07,
    text: "Groove Xcape",
  },
  {
    image: perfume08,
    text: "Boss",
  },
  {
    image: perfume09,
    text: "Versace Woman",
  },
  {
    image: perfume10,
    text: "Acqua di Giò",
  },
  {
    image: dImage,
    text: "Le Beau",
  },
  {
    image: perfume11,
    text: "Althaïr",
  },
  {
    image: perfume12,
    text: "La Belle",
  },
];

const Home = () => {
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
        <div
          className="split-card split-unisex"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(249, 252, 250, 0.88), rgba(245, 249, 247, 0.76)), url(${unisexImage})`,
          }}
        >
          <h2>Unisex</h2>
          <p>Equilibre, moderne, pour tous.</p>
          <Link className="btn btn-primary" to="/unisex">Explorer Unisex</Link>
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
          textColor="#3a2418"
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.05}
        />
      </section>

      <section className="contact-card">
        <div className="contact-brand">
          <img src={siteLogo} alt="Kadiri Parfum" className="contact-brand-logo" />
          <div className="contact-brand-copy">
            <span className="contact-kicker">Kadiri Parfum</span>
            <h2>Visitez la boutique ou contactez-nous</h2>
          </div>
        </div>
        <div className="contact-actions">
          <a
            className="btn btn-maps"
            href="https://maps.app.goo.gl/LLt1NTMaAmXSjyWC7"
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
            className="btn btn-whatsapp"
            href="https://wa.me/212661407755"
            target="_blank"
            rel="noreferrer"
          >
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.59 2 2.16 6.43 2.16 11.87c0 1.74.45 3.43 1.31 4.93L2 22l5.35-1.4a9.83 9.83 0 0 0 4.68 1.19h.01c5.44 0 9.87-4.43 9.87-9.87 0-2.64-1.03-5.12-2.86-6.98zm-7.02 15.17h-.01a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-3.18.83.85-3.1-.2-.32a8.14 8.14 0 0 1-1.25-4.34c0-4.49 3.65-8.14 8.15-8.14 2.17 0 4.21.84 5.74 2.38a8.07 8.07 0 0 1 2.38 5.76c0 4.49-3.65 8.14-8.14 8.14zm4.46-6.11c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.95-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.8-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.15 1.51.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"
                  fill="currentColor"
                />
              </svg>
            </span>
            WhatsApp
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
