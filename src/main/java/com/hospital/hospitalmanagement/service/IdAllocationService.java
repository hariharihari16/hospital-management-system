package com.hospital.hospitalmanagement.service;

import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Centralized ID allocation service for entities whose PostgreSQL primary key
 * columns are manually supplied integer IDs without automatic sequence generation.
 *
 * Provides thread-safe, high-water-mark tracking within the application instance
 * to prevent ID collisions even during rapid concurrent entity creation.
 */
@Service
public class IdAllocationService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ConcurrentMap<String, Long> highWaterMarks = new ConcurrentHashMap<>();

    public IdAllocationService() {
    }

    public IdAllocationService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Safely allocates the next sequential integer ID for the given entity.
     * Synchronized to prevent concurrent collision within the application instance.
     * Computes the ID as strictly greater than both the current database maximum
     * and the last allocated ID in memory.
     *
     * @param entityName Simple entity class name for JPQL (e.g., "Patient", "Doctor")
     * @param idFieldName The primary key property name on the entity (e.g., "patientId", "doctorId")
     * @return Next safe unique integer ID
     */
    public synchronized Long allocateNextId(String entityName, String idFieldName) {
        Long maxInDb = null;
        if (entityManager != null) {
            try {
                String jpql = "SELECT MAX(e." + idFieldName + ") FROM " + entityName + " e";
                maxInDb = entityManager.createQuery(jpql, Long.class).getSingleResult();
            } catch (Exception e) {
                // If table is empty or query fails, maxInDb remains null
            }
        }
        return allocateNextIdWithMax(entityName, maxInDb);
    }

    /**
     * Allocates the next ID using an explicitly known maximum database ID.
     *
     * @param entityName Identifier key for the entity type
     * @param maxInDb The current maximum ID retrieved from the database
     * @return Next safe unique integer ID
     */
    public synchronized Long allocateNextIdWithMax(String entityName, Long maxInDb) {
        long currentMax = (maxInDb != null) ? maxInDb : 0L;
        long lastAllocated = highWaterMarks.getOrDefault(entityName, 0L);
        long nextId = Math.max(currentMax, lastAllocated) + 1L;
        highWaterMarks.put(entityName, nextId);
        return nextId;
    }

    /**
     * Records a custom, client-supplied ID so subsequent auto-allocations
     * do not collide with it.
     *
     * @param entityName Identifier key for the entity type
     * @param customId The client-provided ID
     */
    public synchronized void recordCustomId(String entityName, Long customId) {
        if (customId != null && customId > 0) {
            long current = highWaterMarks.getOrDefault(entityName, 0L);
            if (customId > current) {
                highWaterMarks.put(entityName, customId);
            }
        }
    }
}
