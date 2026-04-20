import { useState } from "react";

const AddActivityModal = ({ isOpen, onClose, onSave, token }) => {
  const [form, setForm] = useState({
    title: "",
    time: "",
    status: "today"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/v1/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.success) {
      onSave(data.activity); // update UI
      onClose();
      setForm({ title: "", time: "", status: "today" });
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add Activity</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Activity Title"
            className="w-full border p-2 rounded"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Time (e.g. 2:00 PM)"
            className="w-full border p-2 rounded"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />

          <select
            className="w-full border p-2 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>

            <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded">
              Save
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddActivityModal;