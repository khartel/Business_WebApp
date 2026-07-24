const {
  app,
  request,
  createSuperAdminWithBusiness,
  addAndLoginTeamMember,
} = require("./helpers");

/**
 * Regression tests for the cross-business IDOR fix.
 * Before the fix, `belongsToBusiness` was defined but never wired into any
 * nested router, so any authenticated user could read/write another
 * business's data just by putting its id in the URL. These tests fail loudly
 * if that middleware is ever removed or a new nested router forgets it.
 */
describe("Cross-business access control (IDOR regression)", () => {
  test("a SuperAdmin cannot access a business they do not own", async () => {
    const ownerA = await createSuperAdminWithBusiness();
    const ownerB = await createSuperAdminWithBusiness();

    const res = await request(app)
      .get(`/api/businesses/${ownerA.business.id}/warehouses`)
      .set("Cookie", ownerB.cookie);

    expect(res.status).toBe(403);
  });

  test("an employee of business A cannot read business B's warehouses, team, products, transactions or reports", async () => {
    const ownerA = await createSuperAdminWithBusiness();
    const ownerB = await createSuperAdminWithBusiness();

    const employeeA = await addAndLoginTeamMember(ownerA.cookie, ownerA.business.id, "EMPLOYEE");
    expect(employeeA.addResponse.status).toBe(201);

    // Sanity check: the employee CAN read their own business's data.
    const ownWarehouses = await request(app)
      .get(`/api/businesses/${ownerA.business.id}/warehouses`)
      .set("Cookie", employeeA.cookie);
    expect(ownWarehouses.status).toBe(200);

    const endpoints = [
      { method: "get", path: "warehouses" },
      { method: "get", path: "team" },
      { method: "get", path: "products" },
      { method: "get", path: "stock" },
      { method: "get", path: "stock/movements" },
      { method: "get", path: "transactions" },
    ];

    for (const { method, path } of endpoints) {
      const res = await request(app)
        [method](`/api/businesses/${ownerB.business.id}/${path}`)
        .set("Cookie", employeeA.cookie);

      expect([403]).toContain(res.status);
    }
  });

  test("an admin of business A cannot create resources inside business B", async () => {
    const ownerA = await createSuperAdminWithBusiness();
    const ownerB = await createSuperAdminWithBusiness();

    const adminA = await addAndLoginTeamMember(ownerA.cookie, ownerA.business.id, "ADMIN");

    const res = await request(app)
      .post(`/api/businesses/${ownerB.business.id}/products`)
      .set("Cookie", adminA.cookie)
      .send({ name: "Sneaky Product", unit: "pcs" });

    expect(res.status).toBe(403);
  });

  test("a business's own admin can manage its products", async () => {
    const owner = await createSuperAdminWithBusiness();
    const admin = await addAndLoginTeamMember(owner.cookie, owner.business.id, "ADMIN");

    const res = await request(app)
      .post(`/api/businesses/${owner.business.id}/products`)
      .set("Cookie", admin.cookie)
      .send({ name: "Legit Product", unit: "pcs", price: 100 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Legit Product");
  });

  test("rejects a made-up business id with 403, not a 500", async () => {
    const owner = await createSuperAdminWithBusiness();

    const res = await request(app)
      .get("/api/businesses/00000000-0000-0000-0000-000000000000/warehouses")
      .set("Cookie", owner.cookie);

    expect(res.status).toBe(403);
  });
});
