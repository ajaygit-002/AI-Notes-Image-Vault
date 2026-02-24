import React, { useEffect, useState } from "react";

function Notes() {
	const [notes, setNotes] = useState([]);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Get token from localStorage
	const token = localStorage.getItem("token");

	// Fetch notes
	useEffect(() => {
		if (!token) return;
		fetch("http://localhost:5000/api/notes", {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
			.then(res => res.json())
			.then(data => setNotes(data))
			.catch(() => setError("Failed to fetch notes"));
	}, [token]);

	// Create note
	const handleCreate = async e => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("http://localhost:5000/api/notes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ title, content })
			});
			if (!res.ok) throw new Error("Failed to create note");
			const newNote = await res.json();
			setNotes([...notes, newNote]);
			setTitle("");
			setContent("");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Delete note
	const handleDelete = async id => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if (!res.ok) throw new Error("Failed to delete note");
			setNotes(notes.filter(note => note._id !== id));
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="notes-container">
			<h2>Your Notes</h2>
			<form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
				<input
					type="text"
					placeholder="Title"
					value={title}
					onChange={e => setTitle(e.target.value)}
					required
				/>
				<textarea
					placeholder="Content"
					value={content}
					onChange={e => setContent(e.target.value)}
					required
				/>
				<button type="submit" disabled={loading}>Create Note</button>
			</form>
			{error && <div style={{ color: 'red' }}>{error}</div>}
			<ul>
				{notes.map(note => (
					<li key={note._id} style={{ marginBottom: 10 }}>
						<strong>{note.title}</strong>
						<p>{note.content}</p>
						<button onClick={() => handleDelete(note._id)} disabled={loading}>Delete</button>
					</li>
				))}
			</ul>
		</div>
	);
}

export default Notes;