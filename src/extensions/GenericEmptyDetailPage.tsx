import * as React from 'react';

import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';

const GenericEmptyDetailPage = ({ kind }: { kind: string }) => {
  // assume that kind is actually "group~version~kind" i.e.
  // "forklift.konveyor.io~v1beta1~Provider"
  return (
    <>
      <HorizontalNav resource={{ kind }} pages={[]} />
    </>
  );
};

export default GenericEmptyDetailPage;
