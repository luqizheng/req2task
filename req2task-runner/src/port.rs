use anyhow::{bail, Result};
use parking_lot::Mutex;
use std::collections::HashSet;
use tracing::{debug, warn};

pub struct PortAllocator {
    base: u16,
    range_start: u16,
    range_end: u16,
    used_ports: Mutex<HashSet<u16>>,
}

impl PortAllocator {
    pub fn new(base: u16, range_start: u16, range_end: u16) -> Self {
        Self {
            base,
            range_start,
            range_end,
            used_ports: Mutex::new(HashSet::new()),
        }
    }

    pub fn allocate(&self, count: usize) -> Result<Vec<u16>> {
        let mut used = self.used_ports.lock();
        let mut allocated = Vec::with_capacity(count);

        for port in (self.range_start..=self.range_end).step_by(2) {
            if allocated.len() >= count {
                break;
            }

            if !used.contains(&port) && !used.contains(&(port + 1)) {
                used.insert(port);
                used.insert(port + 1);
                allocated.push(port);
                debug!("Allocated ports {} and {}", port, port + 1);
            }
        }

        if allocated.len() < count {
            for port in &allocated {
                used.remove(port);
                used.remove(&(port + 1));
            }
            bail!(
                "Not enough ports available. Requested {}, available {}",
                count,
                allocated.len()
            );
        }

        Ok(allocated)
    }

    pub fn allocate_single(&self) -> Result<u16> {
        let ports = self.allocate(1)?;
        Ok(ports[0])
    }

    pub fn release(&self, base_port: u16) {
        let mut used = self.used_ports.lock();
        used.remove(&base_port);
        used.remove(&(base_port + 1));
        debug!("Released ports {} and {}", base_port, base_port + 1);
    }

    pub fn release_all(&self, ports: &[u16]) {
        for port in ports {
            self.release(*port);
        }
    }

    pub fn get_available_count(&self) -> usize {
        let used = self.used_ports.lock();
        let total_range = ((self.range_end - self.range_start) / 2) + 1;
        total_range.saturating_sub(used.len() / 2)
    }

    pub fn is_port_available(&self, port: u16) -> bool {
        let used = self.used_ports.lock();
        !used.contains(&port)
    }

    pub fn get_used_ports(&self) -> Vec<u16> {
        let used = self.used_ports.lock();
        used.iter().copied().collect()
    }

    pub fn validate_port(&self, port: u16) -> Result<()> {
        if port < self.range_start || port > self.range_end {
            bail!("Port {} out of range ({}-{})", port, self.range_start, self.range_end);
        }
        Ok(())
    }
}

impl Clone for PortAllocator {
    fn clone(&self) -> Self {
        Self {
            base: self.base,
            range_start: self.range_start,
            range_end: self.range_end,
            used_ports: Mutex::new(HashSet::new()),
        }
    }
}
