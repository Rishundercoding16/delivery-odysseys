package com.delivery.models;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Graph {

    private Map<LocationNode, List<Edge>> adjacencyList;

    public Graph() {
        adjacencyList = new HashMap<>();
    }

    public void addNode(LocationNode node) {
        adjacencyList.putIfAbsent(node, new ArrayList<>());
    }

    public void addEdge(LocationNode source,
                        LocationNode destination,
                        double distance) {

        adjacencyList.get(source)
                .add(new Edge(destination, distance));

        adjacencyList.get(destination)
                .add(new Edge(source, distance));
    }

    public Map<LocationNode, List<Edge>> getAdjacencyList() {
        return adjacencyList;
    }
}