"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabaseClient';
import Image from 'next/image';
import { PostgrestError } from '@supabase/supabase-js';
import { CldUploadWidget } from 'next-cloudinary';




interface Plant {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  kingdom: string;
  clade: string[] | string;
  order: string;
  family: string;
  genus: string;
  species: string;
  image: string;
  scientific_name?: string;
}

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');

  const handleAuth = () => {
    console.log("Auth button clicked");
    const adminPass = prompt("Enter admin password:");
    if (adminPass === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuth(true);
    } else {
      alert("Invalid password");
    }
  };
  interface FormData {
    name: string;
    scientificName: string;
    description: string;
    kingdom: string;
    clade: string | string[];
    order: string;
    family: string;
    genus: string;
    species: string;
    image: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    scientificName: '',
    description: '',
    kingdom: 'Plantae',
    clade: '',
    order: '',
    family: '',
    genus: '',
    species: '',
    image: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';

  // Fetch all plants from Supabase
  useEffect(() => {
    async function fetchPlants() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('plants')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setPlants(data);
        }
      } catch (error) {
        console.error('Error fetching plants:', error);
        alert('Failed to fetch plants. Please check the console for details.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlants();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'clade' 
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : value
    }));
  };

  // Add new plant to Supabase
  const addPlant = async (plantData: Omit<Plant, 'id'>) => {
    try {
      console.log('Adding plant with data:', plantData); // Debug log
      // Transform the data to match database column names
      const dbData = {
        name: plantData.name,
        scientific_name: plantData.scientificName,
        description: plantData.description,
        kingdom: plantData.kingdom,
        clade: plantData.clade,
        order: plantData.order,
        family: plantData.family,
        genus: plantData.genus,
        species: plantData.species,
        image: plantData.image || '' // Ensure image is never undefined
      };

      const { data, error } = await supabase
        .from('plants')
        .insert([dbData])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the response back to match our frontend interface
        const transformedData = {
          ...data[0],
          scientificName: data[0].scientific_name
        };
        delete transformedData.scientific_name;
        
        setPlants([...plants, transformedData as Plant]);
        return transformedData as Plant;
      }
    } catch (error) {
      const pgError = error as PostgrestError;
      console.error('Error adding plant:', pgError.message);
      alert('Failed to add plant. Please check the console for details.');
      return null;
    }
  };

  // Update existing plant in Supabase
  const updatePlant = async (id: number, plantData: Omit<Plant, 'id'>) => {
    try {
      // Transform the data to match database column names
      const dbData = {
        name: plantData.name,
        scientific_name: plantData.scientificName,
        description: plantData.description,
        kingdom: plantData.kingdom,
        clade: plantData.clade,
        order: plantData.order,
        family: plantData.family,
        genus: plantData.genus,
        species: plantData.species,
        image: plantData.image
      };

      const { data, error } = await supabase
        .from('plants')
        .update(dbData)
        .eq('id', id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the response back to match our frontend interface
        const transformedData = {
          ...data[0],
          scientificName: data[0].scientific_name
        };
        delete transformedData.scientific_name;
        
        setPlants(plants.map(plant => plant.id === id ? transformedData as Plant : plant));
        return transformedData as Plant;
      }
    } catch (error) {
      console.error('Error updating plant:', error);
      alert('Failed to update plant. Please check the console for details.');
      return null;
    }
  };

  // Delete plant from Supabase
  const deletePlant = async (id: number) => {
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setPlants(plants.filter(plant => plant.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert('Failed to delete plant. Please check the console for details.');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image) {
      alert('Please upload an image before submitting');
      return;
    }
    
    // Format the data properly for Supabase
    const plantData: Omit<Plant, 'id'> = {
      ...formData,
      // Convert clade from string to array if it's not already
      clade: typeof formData.clade === 'string' 
        ? formData.clade.split(',').map((item: string) => item.trim()) 
        : formData.clade,
      // Ensure image URL is included
      image: formData.image
    };
    
    if (editingId) {
      // Update existing plant
      const updated = await updatePlant(editingId, plantData);
      if (updated) {
        setEditingId(null);
      }
    } else {
      // Add new plant
      await addPlant(plantData);
    }
    
    // Reset form and switch to view tab
    setFormData({
      name: '',
      scientificName: '',
      description: '',
      kingdom: 'Plantae',
      clade: '',
      order: '',
      family: '',
      genus: '',
      species: '',
      image: ''
    });
    setActiveTab('view');
  };

  const handleEdit = (plant: Plant) => {
    setFormData({
      ...plant,
      clade: Array.isArray(plant.clade) ? plant.clade.join(', ') : plant.clade
    });
    setEditingId(plant.id);
    setActiveTab('add');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this plant?')) {
      await deletePlant(id);
    }
  };

  const downloadQRCode = (plantName: string) => {
    try {
      const qrDiv = document.querySelector(`div[data-plant="${getSlug(plantName)}"]`);
      const qrElement = qrDiv?.querySelector('svg') as SVGElement;
      if (!qrElement) {
        console.error('QR code element not found');
        return;
      }

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(qrElement);

      // Create an image to draw on canvas
      const img = document.createElement('img');
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Create download link
        const link = document.createElement('a');
        link.download = `${getSlug(plantName)}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const getSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-');
  };

  // Protect routes based on authentication
  useEffect(() => {
    if (!isAuth && activeTab === "add") {
      setActiveTab("view");
    }
  }, [isAuth, activeTab]);

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content flex flex-col gap-2">
            <div>
              <h1>GSSS Ladhowal Plant Database</h1>
            </div>
            <div className="auth-section">
              {isAuth ? (
                <button onClick={() => setIsAuth(false)} className="auth-btn">
                  Sign Out
                </button>
              ) : (
                <button onClick={handleAuth} className="auth-btn">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <div >
          {/* <div 
            className={`tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}>
            View Plants
          </div> */}
          {isAuth && (
            <div 
              className={`tab ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('add');
                if (editingId) {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    scientificName: '',
                    description: '',
                    kingdom: 'Plantae',
                    clade: '',
                    order: '',
                    family: '',
                    genus: '',
                    species: '',
                    image: ''
                  });
                }
              }}>
              {editingId ? 'Edit Plant' : 'Add New Plant'}
            </div>
          )}
          </div>

        {/* View Plants Tab */}
        <div className={`content ${activeTab === 'view' ? 'active' : ''}`}>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your botanical collection...</p>
            </div>
          ) : plants.length === 0 ? (
            <div className="no-plants">
              <p>No plants found. Add your first plant to get started!</p>
              <button 
                onClick={() => setActiveTab('add')} 
                className="plant-btn"
              >
                Add Your First Plant
              </button>
            </div>
          ) : (
            <div className="plant-list">
              {plants.map(plant => (
                <div key={plant.id} className="plant-card">
                  <div className="plant-img">
                    <Image 
                      src={plant.image || "/placeholder-plant.jpg"} 
                      alt={plant.name} 
                      width={300}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="plant-info">
                    <h3 className="plant-name">{plant.name}</h3>
                    <p className="plant-scientific">{plant.scientificName}</p>
                    <p>{plant.description.substring(0, 100)}...</p>
                    
                    <div className="plant-actions">
                      <Link href={`/plant/${getSlug(plant.name)}`} className="plant-btn">
                        View Details
                      </Link>
                      {isAuth && (
                        <>
                          <button onClick={() => handleEdit(plant)} className="plant-btn edit">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(plant.id)} className="plant-btn delete">
                            Delete
                          </button>
                          <button onClick={() => downloadQRCode(plant.name)} className="plant-btn qr">
                            Download QR
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="qr-hidden" data-plant={getSlug(plant.name)}>
                      <QRCode 
                        value={`${baseUrl}/plant/${getSlug(plant.name)}`} 
                        size={128} 
                        level="H"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Plant Tab */}
        <div className={`content ${activeTab === 'add' ? 'active' : ''}`}>
          <div className="card">
            <div className="card-header">
              <h2>{editingId ? 'Edit Plant Information' : 'Add New Plant'}</h2>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Common Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scientificName">Scientific Name</label>
                  <input 
                    type="text" 
                    id="scientificName" 
                    name="scientificName"
                    value={formData.scientificName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="kingdom">Kingdom</label>
                    <input 
                      type="text" 
                      id="kingdom" 
                      name="kingdom"
                      value={formData.kingdom}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="clade">Clades (comma-separated)</label>
                    <input 
                      type="text" 
                      id="clade" 
                      name="clade"
                      value={Array.isArray(formData.clade) ? formData.clade.join(', ') : formData.clade}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="order">Order</label>
                    <input 
                      type="text" 
                      id="order" 
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="family">Family</label>
                    <input 
                      type="text" 
                      id="family" 
                      name="family"
                      value={formData.family}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="genus">Genus</label>
                    <input 
                      type="text" 
                      id="genus" 
                      name="genus"
                      value={formData.genus}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="species">Species</label>
                    <input 
                      type="text" 
                      id="species" 
                      name="species"
                      value={formData.species}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="image">Plant Image</label>
                  <CldUploadWidget
                    uploadPreset="wompwomp"
                    onSuccess={(results) => {
                      console.log('Upload success:', results); // Debug log
                      const info = results.info as { secure_url: string };
                      if (info && info.secure_url) {
                        console.log('Setting image URL:', info.secure_url); // Debug log
                        setFormData(prev => ({ ...prev, image: info.secure_url }));
                      } else {
                        console.error('No secure_url in upload response:', results);
                        alert('Error uploading image. Please try again.');
                      }
                    }}
                    onError={(error) => {
                      console.error('Upload error:', error);
                      alert('Error uploading image. Please try again.');
                    }}
                    options={{
                      maxFiles: 1,
                      sources: ['local', 'url', 'camera'],
                      resourceType: "image",
                      clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
                      maxFileSize: 10000000 // 10MB
                    }}
                  >
                    {({ open }) => (
                      <div className="upload-container">
                        <button type="button" className="upload-button" onClick={() => open()}>
                          Upload Image
                        </button>
                        {formData.image && (
                          <div className="image-preview">
                            <Image 
                              src={formData.image} 
                              alt="Preview" 
                              width={200} 
                              height={150}
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CldUploadWidget>
                </div>

                <button type="submit" className="plant-btn">
                  {editingId ? 'Update Plant' : 'Add Plant'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Government Senior Secondary School, Ladhowal</p>
        </div>
      </footer>

      <style jsx global>{`
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

        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .container {
          width: 92%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header {
          background-color: var(--white);
          color: var(--black);
          padding: 1.5rem 0;
          box-shadow: var(--shadow);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(120deg, var(--primary), var(--primary-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .header-subtitle {
          color: var(--gray);
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        .auth-section {
          margin-left: 2rem;
        }

        .auth-btn {
          background-color: var(--primary);
          color: var(--white);
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .auth-btn:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
          padding: 0.5rem;
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
        }

        .tab {
          flex: 1;
          padding: 1rem;
          text-align: center;
          background-color: transparent;
          color: var(--gray);
          cursor: pointer;
          border-radius: var(--border-radius);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .tab:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .tab.active {
          background-color: var(--primary);
          color: var(--white);
        }

        .content.active {
          display: block;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .loading-spinner::after {
          content: "";
          width: 40px;
          height: 40px;
          border: 4px solid var(--primary-light);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-plants {
          text-align: center;
          margin: 4rem 0;
          padding: 2rem;
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
        }

        .plant-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          padding: 1rem 0;
        }

        .plant-card {
          background-color: var(--white);
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
        }

        .plant-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .plant-img {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .plant-img img {
          transition: transform 0.5s ease;
        }

        .plant-card:hover .plant-img img {
          transform: scale(1.05);
        }

        .plant-info {
          padding: 1.5rem;
        }

        .plant-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 0.5rem;
        }

        .plant-scientific {
          font-size: 1rem;
          font-style: italic;
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .plant-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .plant-btn {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          flex: 1;
          min-width: fit-content;
          text-align: center;
          text-decoration: none;
        }

        .plant-btn {
          background-color: var(--primary);
          color: var(--white);
        }

        .plant-btn.edit {
          background-color: var(--primary-light);
          color: var(--primary-dark);
        }

        .plant-btn.delete {
          background-color: var(--accent);
          color: var(--white);
        }

        .plant-btn.qr {
          background-color: var(--gray-light);
          color: var(--black);
        }

        .plant-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .plant-btn.delete:hover {
          background-color: var(--accent-dark);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--black);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--gray-light);
          border-radius: var(--border-radius);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .upload-container {
          border: 2px dashed var(--primary-light);
          padding: 2.5rem;
          border-radius: var(--border-radius);
          text-align: center;
          transition: all 0.3s ease;
        }

        .upload-container:hover {
          border-color: var(--primary);
          background-color: var(--background);
        }

        .upload-button {
          background-color: var(--primary);
          color: var(--white);
          padding: 1rem 2rem;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .upload-button:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }

        .image-preview {
          margin-top: 1.5rem;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .footer {
          background-color: var(--white);
          color: var(--gray);
          text-align: center;
          padding: 2rem 0;
          margin-top: 4rem;
          box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
        }

        .qr-hidden {
          position: absolute;
          left: -9999px;
          visibility: hidden;
        }

        @media (max-width: 768px) {
          .plant-list {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .header h1 {
            font-size: 1.4rem;
          }

          .plant-actions {
            flex-direction: column;
          }

          .plant-btn {
            width: 100%;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .plant-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}