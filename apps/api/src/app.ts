import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/product/product.routes";
import categoryRoutes from "./modules/category/category.routes";
import warehouseRoutes from "./modules/warehouse/warehouse.routes";
import supplierRoutes from "./modules/supplier/supplier.routes";
import purchaseOrderRoutes from "./modules/purchase-order/purchase-order.routes";
import stockMovementRoutes from "./modules/stock-movement/stock-movement.routes";
import stockOpnameRoutes from "./modules/stock-opname/stock-opname.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import reportRoutes from "./modules/report/report.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/stock-opnames", stockOpnameRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
