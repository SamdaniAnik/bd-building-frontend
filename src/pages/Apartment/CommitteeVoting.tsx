import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function CommitteeVoting() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/apartment/proposals');
      if (res.success) setProposals(res.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCastVote = async (propId: number, voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    try {
      const res: any = await api.post(`/apartment/proposals/${propId}/vote`, { vote: voteType });
      if (res.success) {
        alert(res.message);
        fetchProposals();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording vote');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Apartment System</span>
            <span className="breadcrumb-sep">/</span>
            <span>Governance</span>
          </div>
          <h1 className="page-title">
            <i className="fa-solid fa-check-to-slot text-primary"></i> Owner Committee Decisions & Voting (Section 20)
          </h1>
        </div>
        <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
          Proposal → Discussion → Vote → Resolution
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {proposals.map(p => {
          const totalVotes = (p.votes_for || 0) + (p.votes_against || 0) + (p.votes_abstain || 0);
          const forPct = totalVotes > 0 ? ((p.votes_for / 6) * 100).toFixed(0) : 0;
          return (
            <div key={p.id_proposals} className="card" style={{ borderLeft: '5px solid #4f46e5' }}>
              <div className="card-header flex-between">
                <div>
                  <span className={`badge ${p.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                    {p.status} RESOLUTION
                  </span>
                  <span className="text-xs text-muted ml-2" style={{ marginLeft: '8px' }}>
                    Proposed by {p.proposed_by} on {p.proposal_date}
                  </span>
                </div>
                <div className="fw-bold text-primary">
                  Est. Facility Cost: ৳${parseFloat(p.estimated_cost).toLocaleString()}
                </div>
              </div>
              <div className="card-body">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{p.title}</h3>
                <p className="text-sm text-muted mb-4">{p.description}</p>

                {/* Voting Bar */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div className="flex-between text-sm mb-2">
                    <span className="fw-bold">Owner Vote Tally:</span>
                    <span>
                      <strong className="text-success">{p.votes_for} In Favor</strong> &bull;{' '}
                      <strong className="text-danger">{p.votes_against} Opposed</strong> &bull;{' '}
                      {totalVotes} of 6 Flat Owners Voted
                    </span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div className="progress-bar success" style={{ width: `${forPct}%` }}></div>
                  </div>
                </div>

                {/* Cast Vote Action Buttons */}
                <div className="flex-between">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleCastVote(p.id_proposals, 'FOR')}>
                      <i className="fa-solid fa-thumbs-up"></i> Vote In Favor
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCastVote(p.id_proposals, 'AGAINST')}>
                      <i className="fa-solid fa-thumbs-down"></i> Vote Against
                    </button>
                    <button className="btn btn-light btn-sm" onClick={() => handleCastVote(p.id_proposals, 'ABSTAIN')}>
                      Abstain
                    </button>
                  </div>
                  <span className="text-xs text-muted">Voting closes: {p.voting_deadline}</span>
                </div>

                {/* Individual Owner Votes List */}
                <div className="section-heading" style={{ fontSize: '0.8rem', marginTop: '18px' }}>
                  <i className="fa-solid fa-users"></i> Registered Flat Owner Ballots ({p.votes?.length || 0})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                  {(p.votes || []).map((v: any) => (
                    <div key={v.id_votes} className="p-2 rounded border bg-white flex-between text-xs">
                      <span className="fw-semibold">{v.owner_name}</span>
                      <span className={`badge ${v.vote === 'FOR' ? 'badge-success' : 'badge-danger'}`}>
                        {v.vote}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
