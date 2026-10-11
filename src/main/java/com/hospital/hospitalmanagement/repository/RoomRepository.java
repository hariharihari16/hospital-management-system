package com.hospital.hospitalmanagement.repository;

import com.hospital.hospitalmanagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomNumber(String roomNumber);
    boolean existsByRoomNumberAndRoomIdNot(String roomNumber, Long roomId);
}
