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
          --primary: #2e7d32;
          --primary-light: #4caf50;
          --primary-dark: #1b5e20;
          --accent: #f1f8e9;
          --text: #333;
          --text-light: #666;
          --white: #fff;
          --shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: var(--text);
          background-color: #f5f8f5;
        }
        
        .image-wrapper {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
        }

        .plant-detail-img {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          box-shadow: var(--shadow);
          object-fit: cover;
        }
        
        .header {
          background-color: var(--primary);
          color: var(--white);
          text-align: center;
          padding: 2rem 1rem;
        }
        
        .scientific-name {
          font-style: italic;
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .back-link {
          margin-bottom: 2rem;
        }
        
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
        }
        
        @media (max-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
        }
        
        .plant-image-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .plant-detail-img {
          width: 100%;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }
        
        .qr-section {
          background-color: var(--white);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .qr-section h3 {
          margin-bottom: 1rem;
          color: var(--primary);
        }
        
        .qr-section p {
          margin-top: 0.75rem;
          font-size: 0.9rem;
          color: var(--text-light);
        }
        
        .plant-info-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .plant-description, .plant-taxonomy {
          background-color: var(--white);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }
        
        h2 {
          color: var(--primary);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--accent);
        }
        
        .taxonomy-table {
          display: flex;
          flex-direction: column;
        }
        
 .taxonomy-row {
          display: flex;
          padding: 0.75rem 0;
          border-bottom: 1px solid #eee;
        }
        
        .taxonomy-row:last-child {
          border-bottom: none;
        }
        
        .taxonomy-label {
          flex: 1;
          font-weight: bold;
          color: var(--text-light);
        }
        
        .taxonomy-value {
          flex: 2;
        }
        
        .plant-btn {
          display: inline-block;
          padding: 0.5rem 1rem;
          background-color: var(--primary);
          color: var(--white);
          border-radius: 4px;
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-size: 1rem;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 60vh;
          font-size: 1.2rem;
          color: var(--text-light);
        }
        
        .error-container {
          text-align: center;
          padding: 3rem 1rem;
        }
        
        .error-container h1 {
          color: #e53935;
          margin-bottom: 1rem;
        }
        
        .error-container p {
          margin-bottom: 2rem;
        }
        
        .footer {
          background-color: var(--primary);
          color: var(--white);
          text-align: center;
          padding: 1rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
    );
}