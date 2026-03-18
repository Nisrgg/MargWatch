// Mapping from mock complaint image paths to actual bundled assets.
// React Native requires static paths in require(), so we centralize them here.

export const complaintImageSources: Record<string, any> = {
  '/sample_images/pothole_1.jpg': require('../../assets/sample_images/pothole_1.jpg'),
  '/sample_images/pothole_2.jpg': require('../../assets/sample_images/pothole_2.jpg'),
  '/sample_images/pothole_3.jpg': require('../../assets/sample_images/pothole_3.jpg'),
  '/sample_images/pothole_4.jpg': require('../../assets/sample_images/pothole_4.jpg'),
  '/sample_images/pothole_5.jpg': require('../../assets/sample_images/pothole_5.jpg'),
  '/sample_images/pothole_6.jpg': require('../../assets/sample_images/pothole_6.jpg'),
  '/sample_images/pothole_7.jpg': require('../../assets/sample_images/pothole_7.jpg'),

  '/sample_images/electric_pole_1.jpg': require('../../assets/sample_images/electric_pole_1.jpg'),

  '/sample_images/fallen_tree_1.jpg': require('../../assets/sample_images/fallen_tree_1.jpg'),
  '/sample_images/fallen_tree_2.jpg': require('../../assets/sample_images/fallen_tree_2.jpg'),
  '/sample_images/fallen_tree_3.jpg': require('../../assets/sample_images/fallen_tree_3.jpg'),
  '/sample_images/fallen_tree_4.jpg': require('../../assets/sample_images/fallen_tree_4.jpg'),
  '/sample_images/fallen_tree_5.jpg': require('../../assets/sample_images/fallen_tree_5.jpg'),
  '/sample_images/fallen_tree_6.jpg': require('../../assets/sample_images/fallen_tree_6.jpg'),
};

