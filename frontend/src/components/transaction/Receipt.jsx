const Receipt = ({ transaction, business, currency, customerName, soldBy }) => {
  if (!transaction) return null;

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      style={{
        width: "80mm",
        padding: "10mm",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Business Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h2
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0" }}
        >
          {business?.name || "Business"}
        </h2>
        {business?.location && (
          <p style={{ margin: "0 0 2px 0", fontSize: "11px" }}>
            {business.location}
          </p>
        )}
        <p style={{ margin: "0", fontSize: "11px" }}>{business?.country}</p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Receipt Title */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <p style={{ fontWeight: "bold", fontSize: "13px", margin: "0" }}>
          SALES RECEIPT
        </p>
      </div>

      {/* Transaction Details */}
      <div style={{ marginBottom: "8px" }}>
        {[
          ["Receipt #:", transaction.id?.slice(0, 8).toUpperCase()],
          ["Date:", formatDate(transaction.createdAt)],
          ["Time:", formatTime(transaction.createdAt)],
          ["Customer:", customerName || "Casual Customer"],
          ["Served by:", soldBy],
          ["Payment:", transaction.paymentMethod],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span>{label}</span>
            <span
              style={{
                fontWeight:
                  label === "Receipt #:" || label === "Payment:"
                    ? "bold"
                    : "normal",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "8px" }}>
        <p style={{ fontWeight: "bold", margin: "0 0 6px 0" }}>ITEMS</p>
        {transaction.items?.map((item, index) => (
          <div key={item.id || index} style={{ marginBottom: "6px" }}>
            <div style={{ fontWeight: "bold" }}>{item.product?.name}</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: "8px",
              }}
            >
              <span>
                {item.quantitySold} {item.product?.unit} x {currency}{" "}
                {formatAmount(item.unitPrice)}
              </span>
              <span style={{ fontWeight: "bold" }}>
                {currency} {formatAmount(item.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        <span>TOTAL</span>
        <span>
          {currency} {formatAmount(transaction.totalAmount)}
        </span>
      </div>

      {/* Notes */}
      {transaction.notes && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <p style={{ fontSize: "11px", margin: "0" }}>
            Note: {transaction.notes}
          </p>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 4px 0", fontSize: "11px" }}>
          Thank you for your business!
        </p>
        <p style={{ margin: "0", fontSize: "10px", color: "#666" }}>
          Powered by BizManager
        </p>
      </div>
    </div>
  );
};

Receipt.displayName = "Receipt";
export default Receipt;