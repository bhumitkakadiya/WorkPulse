import React from 'react';
import HeaderActions from '../HeaderActions';

export default function PageHeader({ breadcrumbs, title }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs && <div className="breadcrumbs">{breadcrumbs}</div>}
        <h1>{title}</h1>
      </div>
      <HeaderActions />
    </div>
  );
}
