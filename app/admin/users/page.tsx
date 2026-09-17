'use client';
import { useEffect, useState } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    // Mock users from seed
    setUsers([
      { id: '1', name: 'Rahul Sharma', phone: '9876543210', role: 'customer', active: true },
      { id: '2', name: 'Ganesh Patil', phone: '9876543211', role: 'shop_owner', active: true },
      { id: '3', name: 'Admin', email: 'admin@digitalbazar.com', role: 'admin', active: true },
    ]);
  }, []);
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Users</h1>
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}><td>{u.name}</td><td>{u.phone || u.email}</td><td><span className="badge badge-info">{u.role}</span></td><td><span className="badge badge-success">Active</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
