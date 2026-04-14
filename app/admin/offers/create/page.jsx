"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/admin/css/custom.css';
import { marketingService } from '@/services';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

const CreateOffer = () => {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    starts_at: '',
    ends_at: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Offer name is required';
    if (!form.code.trim()) errs.code = 'Coupon code is required';
    if (!form.value || isNaN(form.value) || Number(form.value) <= 0) errs.value = 'Enter a valid discount value';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      value: parseFloat(form.value),
    };

    const { error } = await marketingService.createOffer(payload);
    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      toast?.error?.(error);
    } else {
      toast?.success?.('Offer created successfully!');
      router.push('/admin/offers');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add New Offer"
        subtitle="Create a discount code or promotional campaign"
      >
        <Link href="/admin/offers" className="btn-secondary">
          <i className="fas fa-arrow-left" style={{ fontSize: 12 }}></i>
          Back to Offers
        </Link>
      </PageHeader>

      <div style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} className="admin-card" style={{ borderRadius: 16 }}>
          <div className="admin-card-header">
            <h3>Offer Details</h3>
          </div>
          <div className="admin-card-body">
            {submitError && <ErrorBanner message={submitError} compact style={{ marginBottom: 20 }} />}
            
            <FormField
              label="Offer Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Summer Sale 2024"
              required
              error={errors.name}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField
                label="Coupon Code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. SUMMER20"
                required
                error={errors.code}
                hint="Code customers use at checkout"
              />

              <FormField
                label="Discount Type"
                name="type"
                type="select"
                value={form.type}
                onChange={handleChange}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount (₹)' }
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField
                label={form.type === 'percentage' ? 'Discount %' : 'Discount Value (₹)'}
                name="value"
                type="number"
                value={form.value}
                onChange={handleChange}
                placeholder="e.g. 20"
                required
                error={errors.value}
              />

              <div /> {/* Spacer */}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField
                label="Start Date"
                name="starts_at"
                type="date"
                value={form.starts_at}
                onChange={handleChange}
              />

              <FormField
                label="End Date"
                name="ends_at"
                type="date"
                value={form.ends_at}
                onChange={handleChange}
              />
            </div>

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Internal notes about this campaign..."
              rows={3}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--admin-border-light)' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin"></i> Creating...</>
                ) : (
                  <><i className="fas fa-plus"></i> Create Offer</>
                )}
              </button>
              <Link href="/admin/offers" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOffer;
