"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import Image from 'next/image';
import { supabase } from '../../../lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

interface Plant {
    id: number;
    name: string;
    scientificName: string;
    description: string;
    kingdom: string;
    clade: string[];
    order: string;
    family: string;
    subfamily?: string;
    genus: string;
    species: string;
    image: string;
}

export default function PlantDetail() {
    const params = useParams();
    const slug = params?.slug as string;
    const [plant, setPlant] = useState<Plant | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;

        async function fetchPlant() {
            try {
                setLoading(true);
                const normalizedName = decodeURIComponent(slug).replace(/-/g, ' ');

                // First try: direct name match
                const { data, error } = await supabase
                    .from('plants')
                    .select('*')
                    .ilike('name', normalizedName)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                if (data) {
                    setPlant(data);
                } else {
                    // Second try: fetch all and find match
                    const { data: altData, error: altError } = await supabase
                        .from('plants')
                        .select('*');

                    if (altError) {
                        throw altError;
                    }

                    if (altData) {
                        const matchedPlant = altData.find(p =>
                            p.name.toLowerCase().replace(/\s+/g, '-') === slug
                        );

                        if (matchedPlant) {
                            setPlant(matchedPlant);
                        } else {
                            setNotFound(true);
                        }
                    } else {
                        setNotFound(true);
                    }
                }
            } catch (error) {
                const pgError = error as PostgrestError;
                console.error("Error loading plant data:", pgError.message);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }

        fetchPlant();
    }, [slug]);

    if (loading) {
        return <div className="loading">Loading plant information...</div>;
    }

    if (notFound) {
        return (
            <div className="container error-container">
                <h1>Plant Not Found</h1>
                <p>Sorry, we could not find information about this plant.</p>
                <Link href="/" className="plant-btn">
                    Back to Plants List
                </Link>
            </div>
        );
    }
    if (!plant) return null;

    return (<div className="plant-detail-page">
        <header className="header">
            <div className="container">
                <h1>{plant.name}</h1>
                <p className="scientific-name">{plant.scientificName}</p>
            </div>
        </header>

        <main className="container">
            <Link href="/" className="back-btn">
                ← Back to Plants
            </Link>

            <div className="detail-layout">          
                <div className="plant-image-container">
                <div className="image-wrapper">
                    <Image
                        src={plant.image || "/placeholder-plant.jpg"}
                        alt={plant.name}
                        width={600}
                        height={400}
                        style={{ objectFit: 'cover' }}
                        className="plant-detail-img"
                    />
                </div>
            </div>

                <div className="plant-info-container">
                    <section className="plant-description">
                        <h2>Description</h2>
                        <p>{plant.description}</p>
                    </section>

                    <section className="plant-taxonomy">
                        <h2>Taxonomy</h2>
                        <div className="taxonomy-table">
                            <div className="taxonomy-row">
                                <div className="taxonomy-label">Kingdom:</div>
                                <div className="taxonomy-value">{plant.kingdom}</div>
                            </div>

                            {Array.isArray(plant.clade) && plant.clade.length > 0 && (
                                <div className="taxonomy-row">
                                    <div className="taxonomy-label">Clades:</div>
                                    <div className="taxonomy-value">
                                        {plant.clade.join(' → ')}
                                    </div>
                                </div>
                            )}

                            <div className="taxonomy-row">
                                <div className="taxonomy-label">Order:</div>
                                <div className="taxonomy-value">{plant.order}</div>
                            </div>

                            <div className="taxonomy-row">
                                <div className="taxonomy-label">Family:</div>
                                <div className="taxonomy-value">{plant.family}</div>
                            </div>

                            {plant.subfamily && (
                                <div className="taxonomy-row">
                                    <div className="taxonomy-label">Subfamily:</div>
                                    <div className="taxonomy-value">{plant.subfamily}</div>
                                </div>
                            )}

                            <div className="taxonomy-row">
                                <div className="taxonomy-label">Genus:</div>
                                <div className="taxonomy-value">{plant.genus}</div>
                            </div>

                            <div className="taxonomy-row">
                                <div className="taxonomy-label">Species:</div>
                                <div className="taxonomy-value">{plant.species}</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>

        <footer className="footer">
            <div className="container">
                <p>© {new Date().getFullYear()} Government Senior Secondary School, Ladhowal</p>
            </div>
        </footer>      <style jsx global>{`
        :root {
          --primary: #2ECC71;
          --primary-dark: #27AE60;
          --primary-light: #A8E6CF;
          --accent: #FF6B6B;
          --accent-dark: #ee5253;
          --background: #F7F9FC;
          --white: #FFFFFF;
          --black: #2D3436;
          --gray: #636E72;
          --gray-light: #B2BEC3;
          --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --shadow-hover: 0 8px 12px rgba(0, 0, 0, 0.15);
          --border-radius: 12px;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: var(--background);
          color: var(--black);
          line-height: 1.6;
        }

        .plant-detail-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .container {
          width: 92%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .header {
          background-color: var(--white);
          color: var(--black);
          padding: 2rem 0;
          box-shadow: var(--shadow);
          text-align: center;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(120deg, var(--primary), var(--primary-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .scientific-name {
          font-style: italic;
          font-size: 1.2rem;
          color: var(--primary);
          margin-top: 0.5rem;
        }

        .detail-layout {
          display: grid;
          grid-template-columns: minmax(300px, 1fr) 2fr;
          gap: 2rem;
          margin: 2rem 0;
        }

        .plant-image-container {
          position: sticky;
          top: 2rem;
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .image-wrapper:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-hover);
        }

        .plant-detail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .plant-info-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .plant-description, 
        .plant-taxonomy {
          background-color: var(--white);
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
        }

        h2 {
          color: var(--primary);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--primary-light);
        }

        .plant-description p {
          color: var(--gray);
          font-size: 1.1rem;
          line-height: 1.8;
        }

        .taxonomy-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .taxonomy-row {
          display: flex;
          padding: 1rem;
          border-radius: var(--border-radius);
          background-color: var(--background);
          transition: transform 0.2s ease;
        }

        .taxonomy-row:hover {
          transform: translateX(5px);
          background-color: var(--primary-light);
        }

        .taxonomy-label {
          flex: 1;
          font-weight: 600;
          color: var(--primary-dark);
        }

        .taxonomy-value {
          flex: 2;
          color: var(--gray);
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 1rem;
        }

        .loading::after {
          content: "";
          width: 40px;
          height: 40px;
          border: 4px solid var(--primary-light);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          text-align: center;
          padding: 4rem 1rem;
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          margin: 2rem auto;
          max-width: 600px;
        }

        .error-container h1 {
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .error-container p {
          color: var(--gray);
          margin-bottom: 2rem;
        }

        .plant-btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: var(--primary);
          color: var(--white);
          border-radius: var(--border-radius);
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .plant-btn:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }

        .footer {
          background-color: var(--white);
          color: var(--gray);
          text-align: center;
          padding: 2rem 0;
          margin-top: auto;
          box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }

          .plant-image-container {
            position: relative;
            top: 0;
          }

          .header h1 {
            font-size: 2rem;
          }

          .container {
            padding: 1rem;
          }

          .plant-description, 
          .plant-taxonomy {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
    );
}