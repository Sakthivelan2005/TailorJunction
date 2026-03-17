import { Check, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function TailorVerification() {
  const { API_URL, token, socket, adminId } = useAdminAuth();
  const [pendingTailors, setPendingTailors] = useState([]);

  useEffect(() => {
    fetchPendingTailors();

    // REAL-TIME SOCKET LISTENER
    if (socket) {
      socket.on("newTailorRegistered", (newTailor) => {
        setPendingTailors((prev) => [newTailor, ...prev]);
      });
    }
    return () => {
      if (socket) socket.off("newTailorRegistered");
    };
  }, [socket]);

  const fetchPendingTailors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/tailors/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPendingTailors(data.tailors);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (tailorId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this tailor?`))
      return;

    try {
      const res = await fetch(`${API_URL}/api/admin/tailors/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tailorId, action, adminId }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingTailors((prev) =>
          prev.filter((t) => t.tailor_id !== tailorId),
        );
      }
    } catch (err) {
      alert("Error processing action");
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  return (
    <div>
      <h2 className="page-title">Pending Tailor Verifications</h2>

      {pendingTailors.length === 0 ? (
        <div className="card empty-state">
          No pending verifications at the moment. Waiting for new tailors...
        </div>
      ) : (
        <div>
          {pendingTailors.map((tailor) => (
            <div key={tailor.tailor_id} className="card flex-between">
              <div className="flex-gap">
                <img
                  src={getImageUrl(tailor.profile_photo)}
                  alt="Profile"
                  className="avatar"
                />
                <div>
                  <h3>{tailor.shop_name}</h3>
                  <p className="text-gray text-sm mt-1">
                    Owner: {tailor.tailor_name} • Exp: {tailor.experience_years}{" "}
                    years
                  </p>
                  <p
                    className="text-gray text-sm mt-1 flex-gap"
                    style={{ gap: "4px" }}
                  >
                    <MapPin size={14} /> {tailor.house_no}, {tailor.street},{" "}
                    {tailor.district}
                  </p>
                  <div className="mt-3">
                    <a
                      href={`${API_URL}/${tailor.document_url}`}
                      target="_blank"
                      className="link"
                    >
                      View ID Proof
                    </a>
                    <a href={tailor.map_link} target="_blank" className="link">
                      Google Map Link
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex-gap" style={{ gap: "12px" }}>
                <button
                  onClick={() => handleAction(tailor.tailor_id, "verified")}
                  className="btn btn-success"
                >
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={() => handleAction(tailor.tailor_id, "rejected")}
                  className="btn btn-danger-outline"
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
