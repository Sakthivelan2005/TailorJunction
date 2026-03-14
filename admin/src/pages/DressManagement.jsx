import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function DressManagement() {
  const { API_URL, token } = useAdminAuth();
  const [dresses, setDresses] = useState([]);
  const [newDress, setNewDress] = useState({
    category: "women",
    dress_name: "",
    base_price: "",
  });

  useEffect(() => {
    fetchDresses();
  }, []);

  const fetchDresses = async () => {
    const res = await fetch(`${API_URL}/api/dress-types`);
    const data = await res.json();
    if (data.success) setDresses(data.data);
  };

  const handleAddDress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/dresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDress),
      });
      const data = await res.json();
      if (data.success) {
        setDresses([...dresses, data.dress]);
        setNewDress({ category: "women", dress_name: "", base_price: "" });
      }
    } catch (err) {
      alert("Failed to add dress");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this dress type? This affects tailors selling it.",
      )
    )
      return;
    try {
      await fetch(`${API_URL}/api/admin/dresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDresses(dresses.filter((d) => d.dress_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="page-title">Master Dress Catalog</h2>
      <div className="grid-layout">
        {/* Add Dress Form */}
        <div className="card" style={{ height: "fit-content" }}>
          <h3 style={{ marginBottom: "16px" }}>Add New Dress Pattern</h3>
          <form onSubmit={handleAddDress}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={newDress.category}
                onChange={(e) =>
                  setNewDress({ ...newDress, category: e.target.value })
                }
                className="form-select"
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dress Name</label>
              <input
                type="text"
                required
                value={newDress.dress_name}
                onChange={(e) =>
                  setNewDress({ ...newDress, dress_name: e.target.value })
                }
                className="form-input"
                placeholder="e.g. Lehenga Choli"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Base Price (₹)</label>
              <input
                type="number"
                required
                value={newDress.base_price}
                onChange={(e) =>
                  setNewDress({ ...newDress, base_price: e.target.value })
                }
                className="form-input"
                placeholder="e.g. 500"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> Add to Catalog
            </button>
          </form>
        </div>

        {/* Dress List Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dresses.map((dress) => (
                <tr key={dress.dress_id}>
                  <td className="text-gray">#{dress.dress_id}</td>
                  <td style={{ fontWeight: "600" }}>{dress.dress_name}</td>
                  <td>
                    <span className="badge">{dress.category}</span>
                  </td>
                  <td className="text-green">₹{dress.base_price}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(dress.dress_id)}
                      className="btn-icon-danger"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
