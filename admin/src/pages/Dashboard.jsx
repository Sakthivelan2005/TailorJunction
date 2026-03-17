import {
  Activity,
  Flame,
  IndianRupee,
  RotateCcw,
  Scissors,
  ShoppingBag,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminAuth } from "../context/AdminAuthContext";

const URGENCY_FEES_COLORS = {
  normal: "#3b82f6",
  "3_day": "#8b5cf6",
  "2_day": "#f59e0b",
  "1_day": "#ef4444",
};
const URGENCY_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const DUMMY_REVENUE = [
  { date: "Mon", revenue: 0 },
  { date: "Tue", revenue: 0 },
  { date: "Wed", revenue: 0 },
  { date: "Thu", revenue: 0 },
];
const DUMMY_PIE = [{ name: "No Orders Yet", value: 1 }];

export default function Dashboard() {
  const { API_URL, token, socket } = useAdminAuth();

  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    activeTailors: 0,
    pendingVerifications: 0,
  });

  // Live Traffic States
  const [liveTrafficStats, setLiveTrafficStats] = useState({
    totalOnline: 0,
    customersOnline: 0,
  });
  const [liveTrafficGraph, setLiveTrafficGraph] = useState([]);

  const [revenueData, setRevenueData] = useState(DUMMY_REVENUE);
  const [dressPopularity, setDressPopularity] = useState([]);
  const [urgencySplit, setUrgencySplit] = useState([]);

  const [liveFeed, setLiveFeed] = useState(() => {
    const savedFeed = localStorage.getItem("adminLiveFeed");
    return savedFeed ? JSON.parse(savedFeed) : [];
  });

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.emit("joinUserRoom", "ADMIN_ROOM");

      // 1. Order Transaction Feed
      socket.on("liveAdminMetrics", (newData) => {
        setStats((prev) => ({
          ...prev,
          revenue: prev.revenue + Number(newData.orderValue),
          orders: prev.orders + (newData.orderValue > 0 ? 1 : 0),
        }));

        setLiveFeed((prev) => {
          const updatedFeed = [
            {
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
              text: newData.message,
            },
            ...prev,
          ].slice(0, 10);
          localStorage.setItem("adminLiveFeed", JSON.stringify(updatedFeed));
          return updatedFeed;
        });
      });

      // 2. Live Traffic Heartbeat Listener
      socket.on("liveUserMetrics", (trafficData) => {
        setLiveTrafficStats({
          totalOnline: trafficData.totalOnline,
          customersOnline: trafficData.customersOnline,
        });

        setLiveTrafficGraph((prev) => {
          const newGraph = [
            ...prev,
            {
              time: trafficData.time,
              Customers: trafficData.customersOnline,
              Tailors: trafficData.tailorsOnline,
            },
          ];
          return newGraph.slice(-15);
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("liveAdminMetrics");
        socket.off("liveUserMetrics");
      }
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        if (data.charts.revenueTrend && data.charts.revenueTrend.length > 1) {
          setRevenueData(data.charts.revenueTrend);
        }
        setDressPopularity(data.charts.dressPopularity || []);
        setUrgencySplit(data.charts.urgencySplit || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  const handleClearFeed = () => {
    localStorage.removeItem("adminLiveFeed");
    setLiveFeed([]);
  };

  const groupedUrgency = urgencySplit.reduce((acc, curr) => {
    const key = curr.name || "normal";
    acc[key] = (acc[key] || 0) + curr.value;
    return acc;
  }, {});

  const cleanUrgencySplit = Object.keys(groupedUrgency).map((key) => ({
    name: key,
    value: groupedUrgency[key],
  }));

  const pieDataWithColors = (
    cleanUrgencySplit.length > 0 ? cleanUrgencySplit : DUMMY_PIE
  ).map((entry, index) => ({
    ...entry,
    fill:
      cleanUrgencySplit.length > 0
        ? URGENCY_FEES_COLORS[entry.name] ||
          URGENCY_COLORS[index % URGENCY_COLORS.length]
        : "#e2e8f0",
  }));

  const barDataWithColors = dressPopularity.map((entry) => ({
    ...entry,
    fill: entry.max_score >= 2 ? "#f59e0b" : "#10b981",
  }));

  const CustomDressTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: "#fff",
            padding: "12px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", color: "#1e293b" }}>
            {data.name}
          </p>
          <p style={{ margin: "4px 0", color: "#10b981" }}>
            Total Orders: {data.orders}
          </p>
          <p
            style={{
              margin: 0,
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Flame size={14} /> Demand Score: {data.max_score} / 3
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "24px" }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          Business Analytics
        </h2>
        <div className="live-badge">
          <div className="pulse-dot"></div> Live System Active
        </div>
      </div>

      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <div className="stat-card">
          <Users
            size={32}
            className="stat-icon"
            style={{ color: "#8b5cf6", backgroundColor: "#ede9fe" }}
          />
          <div className="stat-title">Total Users Online</div>
          <div className="stat-value">{liveTrafficStats.totalOnline}</div>
        </div>
        <div className="stat-card">
          <Smartphone
            size={32}
            className="stat-icon"
            style={{ color: "#ec4899", backgroundColor: "#fce7f3" }}
          />
          <div className="stat-title">Customers Online</div>
          <div className="stat-value">{liveTrafficStats.customersOnline}</div>
        </div>
        <div className="stat-card">
          <IndianRupee size={32} className="stat-icon" />
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">₹{stats.revenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <ShoppingBag size={32} className="stat-icon" />
          <div className="stat-title">Total Orders</div>
          <div className="stat-value">{stats.orders.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <Scissors size={32} className="stat-icon" />
          <div className="stat-title">Active Tailors</div>
          <div className="stat-value">{stats.activeTailors}</div>
        </div>
        <div className="stat-card">
          <Activity
            size={32}
            className="stat-icon"
            style={{ color: "#ef4444", backgroundColor: "#fee2e2" }}
          />
          <div className="stat-title">Pending Approvals</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>
            {stats.pendingVerifications}
          </div>
        </div>
      </div>

      {/* ROW 1: Live Traffic & Live Action Feed */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Live Server Traffic (Connections)</div>
          <div
            style={{ width: "100%", height: 300, minHeight: 300, minWidth: 0 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={liveTrafficGraph}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Customers"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="Tailors"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title flex-between">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Live Action Feed <Activity size={18} color="#10b981" />
            </div>
            <button
              onClick={handleClearFeed}
              title="Clear Feed"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                padding: "4px",
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="live-feed">
            {liveFeed.length === 0 ? (
              <div className="empty-state">Awaiting new orders...</div>
            ) : (
              liveFeed.map((feed) => (
                <div key={feed.id} className="feed-item">
                  <div className="feed-time">{feed.time}</div>
                  <div
                    className="feed-text"
                    dangerouslySetInnerHTML={{ __html: feed.text }}
                  ></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Revenue Trend & Trending Dress Patterns */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">7-Day Revenue Trend</div>
          <div
            style={{ width: "100%", height: 300, minHeight: 300, minWidth: 0 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title flex-gap" style={{ gap: "8px" }}>
            Trending Dress Patterns <Flame size={18} color="#f59e0b" />
          </div>
          <div
            style={{ width: "100%", height: 300, minHeight: 300, minWidth: 0 }}
          >
            {dressPopularity.length === 0 ? (
              <div className="empty-state" style={{ marginTop: "50px" }}>
                No dresses ordered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barDataWithColors}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#475569"
                    fontSize={12}
                    fontWeight={600}
                    width={100}
                  />
                  <Tooltip
                    content={<CustomDressTooltip />}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="orders" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Customer Urgency Demand (Restored!) */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Customer Urgency Demand</div>
          <div
            style={{ width: "100%", height: 300, minHeight: 300, minWidth: 0 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataWithColors}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              {cleanUrgencySplit.map((entry, i) => (
                <div
                  key={entry.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: "bold",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor:
                        URGENCY_FEES_COLORS[entry.name] ||
                        URGENCY_COLORS[i % URGENCY_COLORS.length],
                    }}
                  ></div>
                  {entry.name.replace("_", " ").toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
