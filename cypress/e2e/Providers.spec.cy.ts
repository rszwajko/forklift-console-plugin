describe("Providers screen", () => {
  it("displays mock data", () => {
    cy.visit("/k8s/all-namespaces/forklift.konveyor.io~v1beta1~Provider");
  });
});
