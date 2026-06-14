package com.delivery;

import java.util.List;

import com.delivery.algorithms.DijkstraRouter;
import com.delivery.models.Graph;
import com.delivery.models.LocationNode;
import com.delivery.models.RouteResult;

public class Main {

    public static void main(String[] args) {

        Graph cityGraph = new Graph();

        LocationNode store =
                new LocationNode(1, "Store", 100, 100);

        LocationNode apartment =
                new LocationNode(2, "Apartment", 200, 150);

        LocationNode mall =
                new LocationNode(3, "Mall", 350, 200);

        LocationNode office =
                new LocationNode(4, "Office", 400, 100);

        cityGraph.addNode(store);
        cityGraph.addNode(apartment);
        cityGraph.addNode(mall);
        cityGraph.addNode(office);

        cityGraph.addEdge(store, apartment, 4);
        cityGraph.addEdge(store, mall, 10);
        cityGraph.addEdge(apartment, mall, 3);
        cityGraph.addEdge(mall, office, 2);

        RouteResult result =
                DijkstraRouter.findShortestPaths(
                        cityGraph,
                        store
                );

        List<LocationNode> route =
                result.buildPath(office);

        System.out.println("Optimized Route:");

        for (LocationNode node : route) {
            System.out.print(
                    node.getName() + " → "
            );
        }

        System.out.println();

        System.out.println(
                "Total Distance: "
                        + result.getDistances()
                        .get(office)
        );
    }
}