import { useEffect, useState } from "react";
import { invoicesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Invoices() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = async () => {
    try {
      const res = await invoicesApi.list(token);
      setInvoices(res.invoices);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const markPaid = async (id) => {
    try {
      await invoicesApi.markPaid(token, id);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const removeInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;

    try {
      await invoicesApi.remove(token, id);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Invoices</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Client</th>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id}>
              <td>
                {inv.invoiceType === 'salary'
                  ? (inv.guard?.name || 'Guard Invoice')
                  : (inv.client?.clientName || inv.client?.companyName || '-')}
              </td>

              <td>{inv.month}</td>

              <td>₹{inv.amount}</td>

              <td>
                {inv.status === "paid" ? (
                  <span style={{ color: "green" }}>Paid</span>
                ) : (
                  <span style={{ color: "red" }}>Unpaid</span>
                )}
              </td>

              <td>
                {inv.status === "unpaid" && (
                  <button onClick={() => markPaid(inv._id)}>
                    Mark Paid
                  </button>
                )}

                <button
                  style={{ marginLeft: "10px" }}
                  onClick={() => removeInvoice(inv._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Invoices;