package com.delivery.algorithms;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

import com.delivery.models.Edge;
import com.delivery.models.Graph;
import com.delivery.models.LocationNode;
import com.delivery.models.RouteResult;

public class DijkstraRouter {

    public static RouteResult findShortestPaths(
            Graph graph,
            LocationNode source
    ) {

        Map<LocationNode, Double> distances =
                new HashMap<>();

        Map<LocationNode, LocationNode> previousNodes =
                new HashMap<>();

        PriorityQueue<LocationNode> priorityQueue =
                new PriorityQueue<>(
                        Comparator.comparingDouble(distances::get)
                );

        for (LocationNode node :
                graph.getAdjacencyList().keySet()) {

            distances.put(node, Double.MAX_VALUE);
        }

        distances.put(source, 0.0);

        priorityQueue.add(source);

        while (!priorityQueue.isEmpty()) {

            LocationNode current =
                    priorityQueue.poll();

            for (Edge edge :
                    graph.getAdjacencyList().get(current)) {

                LocationNode neighbor =
                        edge.getDestination();

                double newDistance =
                        distances.get(current)
                                + edge.getDistance();

                if (newDistance <
                        distances.get(neighbor)) {

                    distances.put(neighbor,
                            newDistance);

                    previousNodes.put(
                            neighbor,
                            current
                    );

                    priorityQueue.add(neighbor);
                }
            }
        }

        return new RouteResult(
                distances,
                previousNodes
        );
    }
}