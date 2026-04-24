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
    <div className="w-full px-6 lg:px-10 xl:px-16 py-6">
      <div className="max-w-[1600px] mx-auto">
        <PageHeader
          title="Add New Offer"
          subtitle="Create a discount code or promotional campaign"
        >
          <Link href="/admin/offers" className="h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all">
            <i className="fas fa-arrow-left text-xs"></i>
            Back to Offers
          </Link>
        </PageHeader>

        <div className="mt-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Offer Configuration</h3>
            </div>
            <div className="p-6 lg:p-8 space-y-8">
              {submitError && <ErrorBanner message={submitError} compact className="mb-6" />}

              <div className="space-y-6">
                <FormField
                  label="Offer Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Summer Sale 2024"
                  required
                  error={errors.name}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
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

                  <div className="hidden md:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-gray-50 pt-6">
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
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  className="h-11 px-8 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 flex-1 md:flex-none"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> Creating...</>
                  ) : (
                    <><i className="fas fa-plus"></i> Create Offer</>
                  )}
                </button>
                <Link href="/admin/offers" className="h-11 px-8 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center transition-all flex-1 md:flex-none">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOffer;
