/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Points", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type PointContainer {
                id: String
                point: Point
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple Point query", async () => {
        const query = gql`
            {
                pointContainers(where: { point: { longitude: 1.0, latitude: 2.0 } }) {
                    point {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE this.point = point($param0)
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Point NOT query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_NOT: { longitude: 1.0, latitude: 2.0 } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE NOT (this.point = point($param0))
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                }
            }"
        `);
    });

    test("Simple Point IN query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_IN: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    point {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE this.point IN [var0 IN $param0 | point(var0)]
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Point NOT IN query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_NOT_IN: [{ longitude: 1.0, latitude: 2.0 }] }) {
                    point {
                        longitude
                        latitude
                        crs
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE NOT (this.point IN [var0 IN $param0 | point(var0)])
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    }
                ]
            }"
        `);
    });

    test("Simple Point LT query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_LT: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE distance(this.point, point($param0.point)) < $param0.distance
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1.1,
                        \\"latitude\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point LTE query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_LTE: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE distance(this.point, point($param0.point)) <= $param0.distance
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1.1,
                        \\"latitude\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point GT query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_GT: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE distance(this.point, point($param0.point)) > $param0.distance
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1.1,
                        \\"latitude\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point GTE query", async () => {
        const query = gql`
            {
                pointContainers(where: { point_GTE: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } }) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE distance(this.point, point($param0.point)) >= $param0.distance
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1.1,
                        \\"latitude\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point DISTANCE query", async () => {
        const query = gql`
            {
                pointContainers(
                    where: { point_DISTANCE: { point: { longitude: 1.1, latitude: 2.2 }, distance: 3.3 } }
                ) {
                    point {
                        longitude
                        latitude
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE distance(this.point, point($param0.point)) = $param0.distance
            RETURN this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point }
            	ELSE NULL
            END AS result',{ this: this },false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1.1,
                        \\"latitude\\": 2.2
                    },
                    \\"distance\\": 3.3
                }
            }"
        `);
    });

    test("Simple Point create mutation", async () => {
        const query = gql`
            mutation {
                createPointContainers(input: { point: { longitude: 1.0, latitude: 2.0 } }) {
                    pointContainers {
                        point {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:PointContainer)
            SET this0.point = point($this0_point)
            RETURN this0
            }
            RETURN [
            this0 { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this0.point IS NOT NULL THEN { point: this0.point, crs: this0.point.crs }
            	ELSE NULL
            END AS result',{ this0: this0 },false) }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_point\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Point update mutation", async () => {
        const query = gql`
            mutation {
                updatePointContainers(where: { id: "id" }, update: { point: { longitude: 1.0, latitude: 2.0 } }) {
                    pointContainers {
                        point {
                            longitude
                            latitude
                            crs
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`PointContainer\`)
            WHERE this.id = $param0
            SET this.point = point($this_update_point)
            RETURN collect(DISTINCT this { point: apoc.cypher.runFirstColumn('RETURN
            CASE
            	WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
            	ELSE NULL
            END AS result',{ this: this },false) }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id\\",
                \\"this_update_point\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
