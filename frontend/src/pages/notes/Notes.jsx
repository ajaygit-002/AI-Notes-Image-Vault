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
import React, { useEffect, useState } from "react";
import "./notes.css";
import ErrorBoundary from "./ErrorBoundary";

function Notes() {
	const [notes, setNotes] = useState([]);
	const [title, setTitle] = useState("");
	const [editId, setEditId] = useState(null);
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
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

	// Start editing note
	const handleEdit = note => {
		setEditId(note._id);
		setEditTitle(note.title);
		setEditContent(note.content);
	};

	// Update note
	const handleUpdate = async e => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`http://localhost:5000/api/notes/${editId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ title: editTitle, content: editContent })
			});
			if (!res.ok) throw new Error("Failed to update note");
			const updated = await res.json();
			setNotes(notes.map(n => n._id === editId ? updated : n));
			setEditId(null);
			setEditTitle("");
			setEditContent("");
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
			setNotes(notes.filter(n => n._id !== id));
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Main render
	return (
		<div className="notes-container">
			<h2>Your Notes</h2>
			{error && <div className="error">{error}</div>}
			<form onSubmit={handleCreate} className="note-form">
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
				<button type="submit" disabled={loading}>Add Note</button>
			</form>
			{editId && (
				<form onSubmit={handleUpdate} style={{ marginBottom: 20, background: '#e3f2fd', padding: 16, borderRadius: 8 }}>
					<h3>Edit Note</h3>
					<input
						type="text"
						placeholder="Title"
						value={editTitle}
						onChange={e => setEditTitle(e.target.value)}
						required
					/>
					<textarea
						placeholder="Content"
						value={editContent}
						onChange={e => setEditContent(e.target.value)}
						required
					/>
					<button type="submit" disabled={loading}>Update Note</button>
					<button type="button" onClick={() => setEditId(null)} style={{ marginLeft: 8 }}>Cancel</button>
				</form>
			)}
			<ul className="notes-list">
				{notes.map(note => (
					<li key={note._id} className="note-item">
						<div className="note-header">
							<span className="note-title">{note.title}</span>
							<button onClick={() => handleEdit(note)} disabled={loading}>Edit</button>
							<button onClick={() => handleDelete(note._id)} disabled={loading} style={{ marginLeft: 8 }}>Delete</button>
						</div>
						<div className="note-content">{note.content}</div>
					</li>
				))}
			</ul>
		</div>
	);
}

// Export Notes wrapped in ErrorBoundary
export default function NotesWithBoundary(props) {
	return (
		<ErrorBoundary>
			<Notes {...props} />
		</ErrorBoundary>
	);
}
